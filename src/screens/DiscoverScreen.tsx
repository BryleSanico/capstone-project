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
import { searchCache } from "../utils/searchCache";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type DiscoverScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Discover">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const {
    cachedEvents,
    isLoading,
    isSyncing,
    hasMore,
    error,
    loadInitialEvents,
    loadMoreEvents,
    syncEvents,
    fetchCategories,
  } = useEvents();

  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const isFocused = useIsFocused();
  const isConnected = useNetworkStatus((state) => state.isConnected);
  // Ref to prevent syncing on the very first mount
  const isInitialMount = useRef(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Discover Events",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShadowVisible: false,
    });
  }, [navigation]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ONLY runs on initial mount or when filters change. It performs a full reload
  useEffect(() => {
    // When the category changes, we treat it as a new search context.
    loadInitialEvents({ query: "", category: selectedCategory });
    fetchCategories();
  }, [selectedCategory, loadInitialEvents, fetchCategories]);

  useEffect(() => {
    if (isInitialMount.current) {
      // Skip sync on the very first render
      isInitialMount.current = false;
    } else if (isFocused) {
      // On subsequent focuses (e.g., navigating back), just sync for new data.
      syncEvents({ query: debouncedQuery, category: selectedCategory });
    }
  }, [isFocused]);

  const displayedEvents = useMemo(
    () => searchCache(cachedEvents, debouncedQuery),
    [cachedEvents, debouncedQuery]
  );

  // If the local search returns no results, and we're online, trigger a network search.
  useEffect(() => {
    if (debouncedQuery && displayedEvents.length === 0 && isConnected) {
      // syncEvents will fetch from the backend using the search query
      syncEvents({ query: debouncedQuery, category: selectedCategory });
    }
  }, [
    displayedEvents.length,
    debouncedQuery,
    isConnected,
    syncEvents,
    selectedCategory,
  ]);

  const handleEventPress = (event: Event) => {
    const isFavorite = favorites.includes(event.id);
    navigation.navigate("EventDetails", {
      id: event.id,
      initialIsFavorite: isFavorite,
    });
  };

  // Handler for infinite scroll
  const handleLoadMore = () => {
    if (!isSyncing && hasMore && isConnected) {
      loadMoreEvents({ query: debouncedQuery, category: selectedCategory });
    }
  };

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await syncEvents({ query: debouncedQuery, category: selectedCategory });
  }, [syncEvents, debouncedQuery, selectedCategory]);

  const renderFooter = () => {
    if (!isSyncing || !hasMore) return null;
    return <Loader size={50} />;
  };

  const renderContent = () => {
    if ((isLoading || isSyncing) && cachedEvents.length === 0) {
      return (
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <LoaderSearch size={120} />
        </SafeAreaView>
      );
    }

    // If there are no results, show the appropriate message.
    if (displayedEvents.length === 0) {
      if (!isConnected) {
        return (
          <OfflineState
            message="You are offline. Please check your network connection."
            onRefresh={handleRefresh}
          />
        );
      }
      if (!isLoading && !isSyncing) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        );
      }
    }

    // Main list rendering from memoize cache
    return (
      <FlatList
        data={displayedEvents}
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
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          !isLoading && !isSyncing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : null
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});
