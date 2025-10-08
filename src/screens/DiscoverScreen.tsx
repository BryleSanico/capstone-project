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
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EventCard from "@/src/components/EventCard";
import SearchBar from "@/src/components/SearchBar";
import CategoryFilter from "@/src/components/CategoryFilter";
import { Event } from "@/src/types/event";
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import { TabParamList } from "@/src/navigation/TabNavigator";
import { useEvents } from "@/src/stores/event-store";
import { useFavorites } from "@/src/stores/favorites-store";
import { OfflineState } from "../components/Errors/offlineState";

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

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

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

  useEffect(() => {
    handleFetch();
  }, [debouncedQuery, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const handleRefresh = () => {
    handleFetch();
  };

  const renderFooter = () => {
    if (!isPaginating) return null;
    // return <ActivityIndicator style={{ marginVertical: 20 }} color="#6366f1" />;
    return (
      <ActivityIndicator style={{ marginVertical: 20 }} color="#ee3f09ff" />
    );
  };

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

    if (error && !isLoading) {
    return <OfflineState message={error} onRefresh={handleRefresh} />;
  }
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

       <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard event={item} onPress={() => handleEventPress(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#6366f1" />}
        // This now only shows if there are no errors and the list is empty.
        ListEmptyComponent={!isLoading && !error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : null}
      />
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
});

