import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, StyleSheet, FlatList, Text, RefreshControl } from "react-native";
import {
  useNavigation,
  CompositeNavigationProp,
  useIsFocused,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EventCard from "../components/Cards/EventCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import { Event } from "../types/event";
import { OfflineState } from "../components/Errors/offlineState";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoaderSearch } from "../components/loaders/loaderSearch";
import { useNetworkStatus } from "../stores/network-store";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useFavorites } from "../stores/favorites-store";
import { useEvents } from "../stores/event-store";
import { TabParamList } from "../navigation/TabNavigator";
import { Loader } from "../components/loaders/loader";
import { searchCache } from "../utils/searchCache";
import { EmptyState } from "../components/Errors/EmptyState";
import { useDebounce } from "../hooks/useDebounce";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type DiscoverScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Discover">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const {
    _fullEventCache,
    displayedEvents,
    isLoading,
    isSyncing,
    hasMore,
    error,
    loadInitialEvents,
    loadMoreEvents,
    syncEvents,
    refreshEvents,
  } = useEvents();

  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const isFocused = useIsFocused();
  const isConnected = useNetworkStatus((state) => state.isConnected);
  const isInitialMount = useRef(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Discover Events",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShadowVisible: false,
    });
  }, [navigation]);

  // Loads from cache AND triggers a background freshness check
  useEffect(() => {
    loadInitialEvents({ query: "", category: selectedCategory });
  }, [selectedCategory, loadInitialEvents]);

  // When the screen is re-focused check cache freshness and sync
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Don't run on first mount
    }

    if (isFocused && !searchQuery) {
      console.log(
        "[Focus] Screen focused. Calling syncEvents to check freshness."
      );
      syncEvents({ query: "", category: "All" });
    }
  }, [isFocused, searchQuery, syncEvents]); 

  const searchResults = useMemo(
    () => searchCache(_fullEventCache, debouncedQuery),
    [_fullEventCache, debouncedQuery]
  );

  const dataForList = debouncedQuery ? searchResults : displayedEvents;

   // Trigger a network search if local search yields no results and we're online.
  useEffect(() => {
    if (debouncedQuery && searchResults.length === 0 && isConnected) {
      syncEvents({ query: debouncedQuery, category: selectedCategory });
    }
  }, [searchResults.length, debouncedQuery, isConnected, syncEvents, selectedCategory]);

  const handleEventPress = (event: Event) => {
    const isFavorite = favorites.includes(event.id);
    navigation.navigate("EventDetails", {
      id: event.id,
      initialIsFavorite: isFavorite,
    });
  };

  // Handler for infinite scroll
  const handleLoadMore = () => {
    if (!isSyncing && hasMore && !debouncedQuery) {
      loadMoreEvents({ query: debouncedQuery, category: selectedCategory });
    }
  };

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (isConnected) {
      await refreshEvents({ query: debouncedQuery, category: selectedCategory });
    }
  }, [refreshEvents, debouncedQuery, selectedCategory, isConnected]);

  const renderFooter = () => {
    // Only show footer loader if we are syncing (fetching)
    // and not in a search query.
    if (!isSyncing || debouncedQuery) return null;
    return (
      <View style={styles.footerContainer}>
        <Loader size={50} />
      </View>
    );
  };

  const renderContent = () => {
   if ((isLoading || isSyncing) && dataForList.length === 0) {
      return (
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <LoaderSearch size={120} />
        </SafeAreaView>
      );
    }

    // Show offline state if offline AND cache is empty
    if (!isConnected && _fullEventCache.length === 0) {
      return (
        <OfflineState
          message="You are offline. Please check your network connection."
          onRefresh={handleRefresh}
        />
      );
    }
    if (isConnected && !isLoading && !isSyncing && dataForList.length === 0) {
      return (
        <EmptyState
          icon="warning-outline"
          title="No events found"
          message="Try adjusting your search or filters"
        />
      );
    }

    // Main list rendering
    return (
      <FlatList
        data={dataForList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.7}
        ListFooterComponent={renderFooter} // Call renderFooter
        extraData={hasMore || isSyncing} // Re-render footer when sync status changes
        refreshControl={
          <RefreshControl
            refreshing={isSyncing && !isLoading} // Show pull-to-refresh only on network sync
            onRefresh={handleRefresh}
            tintColor="#6366f1"
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
    backgroundColor: "#f8f9fa",
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

