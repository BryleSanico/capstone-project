import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  useNavigation,
  CompositeNavigationProp,
  useIsFocused,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EventCard from "../components/ui/Cards/EventCard";
import SearchBar from "../components/ui/SearchBar";
import CategoryFilter from "../components/ui/CategoryFilter";
import { Event } from "../types/event";
import { OfflineState } from "../components/ui/Errors/offlineState";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoaderSearch } from "../components/LazyLoaders/loaderSearch";
import { useNetworkStatus } from "../stores/network-store";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useFavorites } from "../stores/favorites-store";
import { useEvents } from "../stores/event-store";
import { TabParamList } from "../navigation/TabNavigator";
import { Loader } from "../components/LazyLoaders/loader";
import { searchCache } from "../utils/cache/searchCache";
import { EmptyState } from "../components/ui/Errors/EmptyState";
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
    isNetworkSearching,
    hasMore,
    error,
    networkSearchResults,
    loadInitialEvents,
    loadMoreEvents,
    syncEvents,
    refreshEvents,
    searchNetworkEvents, 
    clearNetworkSearch, 
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
      headerStyle: { backgroundColor: "#ffffffff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShadowVisible: false,
    });
  }, [navigation]);

  // Loads from cache AND triggers a background freshness check
  useEffect(() => {
    // This will now re-load events when the category changes,
    // populating both _fullEventCache and displayedEvents from the store.
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
      // We sync "All" to ensure the main cache gets updates,
      syncEvents({ query: "", category: "All" });
    }
  }, [isFocused, searchQuery, syncEvents]);

  // Perform local search on the store's "full" cache
  const localSearchResults = useMemo(
    () => searchCache(_fullEventCache, debouncedQuery),
    [_fullEventCache, debouncedQuery]
  );

  // Determine which list to display based on the search state
  const dataForList = useMemo(() => {
    if (debouncedQuery) {
      // If we are searching
      if (networkSearchResults.length > 0) {
        return networkSearchResults; // 1. Show network results
      }
      return localSearchResults; // 2. Show local cache search results
    }
    return displayedEvents; // 3. Show paginated, category-filtered events
  }, [
    debouncedQuery,
    networkSearchResults,
    localSearchResults,
    displayedEvents,
  ]);

  // Network search fallback logic
  useEffect(() => {
    // If search is cleared, clear network results in store
    if (!debouncedQuery) {
      clearNetworkSearch();
      return;
    }

    // If we found results locally, use them and clear network results
    if (localSearchResults.length > 0) {
      clearNetworkSearch();
      return;
    }

    // If we have a query, no local results, and are online, search network
    if (debouncedQuery && localSearchResults.length === 0 && isConnected) {
      searchNetworkEvents({
        query: debouncedQuery,
        category: selectedCategory,
      });
    }
  }, [
    localSearchResults.length,
    debouncedQuery,
    isConnected,
    selectedCategory,
    searchNetworkEvents, 
    clearNetworkSearch, 
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
    if (!isSyncing && hasMore && !debouncedQuery) {
      loadMoreEvents({ query: debouncedQuery, category: selectedCategory });
    }
  };

  // Handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (isConnected) {
      if (debouncedQuery) {
        // If searching, re-run the network search
        await searchNetworkEvents({
          query: debouncedQuery,
          category: selectedCategory,
        });
      } else {
        // If not searching
        await refreshEvents({
          query: debouncedQuery,
          category: selectedCategory,
        });
      }
    }
  }, [
    refreshEvents,
    searchNetworkEvents,
    debouncedQuery,
    selectedCategory,
    isConnected,
  ]);

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
    // Show loader if (initial cache is loading) OR (a network search is active)
    if ((isLoading || isNetworkSearching) && dataForList.length === 0) {
      return (
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <LoaderSearch size={120} />
        </SafeAreaView>
      );
    }

    // Show offline state if offline AND cache is empty
    if (error && _fullEventCache.length === 0) {
      return (
        <OfflineState
          message="You are offline. Please check your network connection."
          onRefresh={handleRefresh}
        />
      );
    }

    // Show empty state if all filters/searches yield nothing
    if (
      isConnected &&
      !isLoading &&
      !isSyncing &&
      !isNetworkSearching &&
      dataForList.length === 0
    ) {
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
        extraData={hasMore || isSyncing} // Re-render footer
        refreshControl={
          <RefreshControl
            refreshing={
              (isSyncing && !isLoading) || isNetworkSearching
            } // Show refresh on cache sync OR network search
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
    backgroundColor: "#F5F5F7",
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