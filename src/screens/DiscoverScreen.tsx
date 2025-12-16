import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import EventCard from "../components/ui/Cards/EventCard";
import SearchBar from "../components/ui/SearchBar";
import CategoryFilter from "../components/ui/CategoryFilter";
import { Event } from "../types/event";
import { OfflineState } from "../components/ui/Errors/offlineState";
import { LoaderSearch } from "../components/LazyLoaders/loaderSearch";
import { useNetworkStatus } from "../stores/network-store";
import { EmptyState } from "../components/ui/Errors/EmptyState";
import { useDebounce } from "../hooks/";
import { useEventsInfiniteQuery } from "../hooks/";
import { Loader } from "../components/LazyLoaders/loader";
import { RootStackParamList } from "../navigation/AppNavigator";
import { TabParamList } from "../navigation/TabNavigator";
import { Colors } from "../constants/colors";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type DiscoverScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Discover">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const isConnected = useNetworkStatus((state) => state.isConnected);

  // Call useEventsInfiniteQuery with primitives
  const {
    data,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useEventsInfiniteQuery(debouncedQuery, selectedCategory);

  const allEvents = data?.events ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Discover Events",
      headerStyle: { backgroundColor: Colors.white },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetails", {
      id: event.id,
      initialIsFavorite: false,
    });
  };

  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderFooter = () => {
    // Only show footer loader if we are syncing (fetching)
    // and not in a search query.
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerContainer}>
        <Loader size={50} />
      </View>
    );
  };

  const renderContent = () => {
    // Show loader if (initial cache is loading) OR (a network search is active)
    if (isLoading) {
      return (
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <LoaderSearch size={120} />
        </SafeAreaView>
      );
    }
    // Show offline state if not connected and no cached data
    if (!isConnected && allEvents.length === 0) {
      return (
        <OfflineState
          message="You are offline. Please check your network connection."
          onRefresh={handleRefresh}
        />
      );
    }
    // Show empty state if all filters/searches yield nothing
    if (allEvents.length === 0) {
      return (
        <EmptyState
          icon="warning-outline"
          title="No events found"
          message="Try adjusting your search or filters"
        />
      );
    }

    return (
      <FlatList
        data={allEvents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.7}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => {}}
      />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
