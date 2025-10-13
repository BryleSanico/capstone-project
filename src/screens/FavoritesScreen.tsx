import React, { useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  useNavigation,
  CompositeNavigationProp,
  useIsFocused,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import Icon from "react-native-vector-icons/Ionicons";
import { Event } from "../types/event";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import EventCard from "../components/EventCard";
import { useFavorites } from "../stores/favorites-store"; // Corrected import
import { Loader } from "../components/loaders/loader";

// Define the navigation tab
// Note: The screen name here must match the one in TabNavigator.tsx
type FavoritesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "My Favorites">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const isFocused = useIsFocused();
  
  // Data now comes directly from the favorites store
  const { favoriteEvents, isLoading, loadFavorites } = useFavorites();

  useEffect(() => {
    // When the screen is focused, reload the favorites
    if (isFocused) {
      loadFavorites();
    }
  }, [isFocused]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "My Favorites",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
    });
  }, [navigation]);

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetails", {
      id: event.id,
      initialIsFavorite: true,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="heart-outline" size={64} color="#e0e0e0" />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring events and tap the heart icon to save your favorites
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate("Discover")}
      >
        <Text style={styles.exploreButtonText}>Explore Events</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {favoriteEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favoriteEvents} // Use the new state property
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => handleEventPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
