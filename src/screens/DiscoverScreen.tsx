import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  useNavigation,
  CompositeNavigationProp,
  useIsFocused,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EventCard from "../components/EventCard";
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

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type DiscoverScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Discover">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const {
    events,
    isLoading,
    isPaginating,
    hasMore,
    error,
    fetchEvents,
    fetchMoreEvents,
    fetchCategories,
  } = useEvents();
  const { favorites } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
 
  // Subscribe to reactive network state
  const isConnected = useNetworkStatus((state) => state.isConnected);
  
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Discover Events",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShadowVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Used useCallback to prevent re-creating the function on every render
  const handleFetch = useCallback(() => {
    fetchEvents({ query: debouncedQuery, category: selectedCategory });
  }, [debouncedQuery, selectedCategory, fetchEvents]);

  // Effect for initial load and filter changes
  useEffect(() => {
    if (isFocused) {
      handleFetch();
    }
  }, [debouncedQuery, selectedCategory, isFocused]);

  useEffect(() => {
    if (isFocused) {
      fetchCategories();
    }
  }, [fetchCategories, isFocused]);

  const handleEventPress = (event: Event) => {
    const isFavorite = favorites.includes(event.id);
    navigation.navigate("EventDetails", {
      id: event.id,
      initialIsFavorite: isFavorite,
    });
  };

  
  const handleLoadMore = () => {
    if (!isPaginating && hasMore) {
      fetchMoreEvents({ query: debouncedQuery, category: selectedCategory });
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await handleFetch();
    setIsRefreshing(false);
  }, [handleFetch]);
  
  const renderFooter = () => {
    if (!isPaginating) return null;
    return <Loader size={50} />;
  };
  

  const renderContent = () => {
    if (error && !isLoading) {
    return <OfflineState message={error} onRefresh={handleRefresh} />;
    }
    
    if (!isConnected && isFocused) {
      return <OfflineState message="You are offline. Please check your network connection." onRefresh={handleRefresh} />;
    }
    if (isLoading && events.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <LoaderSearch size={120} />
      </SafeAreaView>
    );
    }
        return (
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard event={item} onPress={() => handleEventPress(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={!isLoading && !error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : null}
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
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
    loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

