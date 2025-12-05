import React, { useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Event } from "../types/event";
import EventCard from "../components/ui/Cards/EventCard";
import { Loader } from "../components/LazyLoaders/loader";
import { useNetworkStatus } from "../stores/network-store";
import { OfflineState } from "../components/ui/Errors/offlineState";
import { EmptyState } from "../components/ui/Errors/EmptyState";
import { useFavoriteEventsQuery } from "../hooks/data/useFavorites";
import { Colors } from "../constants/colors";

type FavoritesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Favorites"
>;

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const isConnected = useNetworkStatus((state) => state.isConnected);

  const { favoriteEvents, isLoading, isRefetching, refetch } =
    useFavoriteEventsQuery();

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
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  if (favoriteEvents.length > 0) {
    return (
      <View style={styles.container}>
        <FlatList
          data={favoriteEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => handleEventPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <OfflineState
          message="You are offline and no favorites are cached."
          onRefresh={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EmptyState
        hasAction={true}
        actionText="Explore Events"
        navigateTo="Discover"
        icon="heart-outline"
        title="No Favorites Yet"
        message="Start exploring events and tap the heart icon to save your favorites"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
