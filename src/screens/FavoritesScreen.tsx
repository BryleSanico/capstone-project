import React, { useCallback, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
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
import EventCard from "../components/Cards/EventCard";
import { useFavorites } from "../stores/favorites-store";
import { Loader } from "../components/LazyLoaders/loader";
import { useNetworkStatus } from "../stores/network-store";
import { OfflineState } from "../components/Errors/offlineState";
import { EmptyState } from "../components/Errors/EmptyState";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type FavoritesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Favorites"
>;

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const isFocused = useIsFocused();
  
  // Data comes directly from the favorites store
  const { favoriteEvents, isLoading, isSyncing, loadFavorites } = useFavorites();
  const isConnected = useNetworkStatus(state => state.isConnected);

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

   const handleRefresh = useCallback(() => {
    loadFavorites();
  }, [loadFavorites]);
  
  const renderEmptyState = () => (
   <EmptyState
      hasAction={true}
      actionText="Explore Events"
      navigateTo="Discover"
      icon="heart-outline"
      title="No Favorites Yet"
      message=" Start exploring events and tap the heart icon to save your favorites"
    />
  );

  const renderOfflineState = () => (      
     <OfflineState
      message="You are offline. Please check your network connection."
      onRefresh={handleRefresh}
    />
  );

  if (isLoading && favoriteEvents.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {favoriteEvents.length === 0 ? (
       !isConnected ? renderOfflineState() : renderEmptyState()
      ) : (
        <FlatList
          data={favoriteEvents} // Use the new state property
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => handleEventPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} tintColor="#6366f1" />
          }
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
});
