// src/screens/TicketsScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { View, Text, StyleSheet, FlatList, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TicketCard from "../components/TicketCard";
import { useTickets } from "../stores/tickets-store";
import { Ticket } from "../types/ticket";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { TabParamList } from "../navigation/TabNavigator";
import { Loader } from "../components/loaders/loader";
import { RefreshControl } from "react-native-gesture-handler";
import { EmptyState } from "../components/Errors/EmptyState";
import { LinearGradient } from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons"

// Define the navigation tab
// Note: The screen name here must match the one in TabNavigator.tsx
type TicketsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "My Tickets">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function TicketsScreen() {
  const navigation = useNavigation<TicketsScreenNavigationProp>();
  const { tickets, isLoading, loadTickets } = useTickets();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "My Tickets",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerShown: false,
    });
  }, [navigation]);

  const handleTicketPress = (ticket: Ticket) => {
    navigation.navigate("TicketDetails", { id: ticket.id });
  };

  const handleRefresh = useCallback(() => {
    loadTickets();
  }, [loadTickets]);

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
                    <Text style={styles.headerTitle}>My Tickets</Text>
                    <Text style={styles.headerSubtitle}>{tickets.length} purchased ticket</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
      <View style={styles.content}>
        {tickets.length === 0 ? (
          <EmptyState icon="ticket-outline" title="No Tickets Yet" message="Your purchased tickets will appear here" />
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TicketCard
                ticket={item}
                onPress={() => handleTicketPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#6366f1" />
          }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    marginHorizontal: 20,

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
});
