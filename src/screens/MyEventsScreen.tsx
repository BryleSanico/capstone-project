// src/screens/MyEventsScreen.tsx
import React, { useCallback, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMyEvents } from "../stores/my-event-store";
import { Loader } from "../components/loaders/loader";
import { EmptyState } from "../components/Errors/EmptyState";
import MyEventCard from "../components/MyEventCard";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/AppNavigator";
import FeatherIcon from "react-native-vector-icons/Feather"
import LinearGradient from "react-native-linear-gradient";

// Define the navigation tab
// Note: The screen name here must match the one in TabNavigator.tsx
type MyEventsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "My Events">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function MyEventsScreen() {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  const { myEvents, isLoading, loadMyEvents, deleteEvent } = useMyEvents();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShown: false,
    });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    loadMyEvents();
  }, [loadMyEvents]);

  const handleDeletePress = (eventId: number, title: string) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEvent(eventId),
        },
      ]
    );
  };

  const handleEditPress = (eventId: number) => {
    navigation.navigate("EventForm", { eventId });
  };

  const handleEventPress = (eventId: number) => {
    navigation.navigate("EventDetails", {
      id: eventId,
      initialIsFavorite: false,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <LinearGradient
          colors={["#8b5cf6", "#6366f1"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Events</Text>
              <Text style={styles.headerSubtitle}>{myEvents.length} events created</Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("EventForm", {})}
            >
              <FeatherIcon name="plus" size={24} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {myEvents.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Events Found"
          message="You haven't organized any events yet."
        />
      ) : (
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MyEventCard
              event={item}
              onPress={() => handleEventPress(item.id)}
              onEdit={() => handleEditPress(item.id)}
              onDelete={() => handleDeletePress(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    marginHorizontal: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginTop: 0
      },
      android: {
        elevation: 8,
        marginVertical: 0,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  headerContent: {
    marginVertical: 25,
    marginHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    marginTop: Platform.OS === "ios" ? 10 : 10,
  },
});
