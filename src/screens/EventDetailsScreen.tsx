// src/screens/EventDetailsScreen.tsx
import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { MOCK_EVENTS } from "../../src/constants/events";
import { useTickets } from "../../src/hooks/tickets-store";
import { Ticket } from "../../src/types/event";
import { RootStackParamList } from "../navigation/AppNavigator";

// Define the types for route and navigation
type EventDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "EventDetails"
>;
type EventDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventDetails"
>;

export default function EventDetailsScreen() {
  const route = useRoute<EventDetailsScreenRouteProp>();
  const navigation = useNavigation<EventDetailsScreenNavigationProp>();

  const { id } = route.params; // Get id from route params
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const { addTicket, toggleFavorite, isFavorite } = useTickets();

  const event = MOCK_EVENTS.find((e) => e.id === id);

  // Use useLayoutEffect to set header options, as it depends on component state (isFavorite)
  useLayoutEffect(() => {
    const isEventFavorite = isFavorite(event!.id); // Using ! since we know event exists

    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerTintColor: "#fff",
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSharePress}
          >
            <Icon name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleFavoritePress}
          >
            <Icon
              name={isEventFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isEventFavorite ? "#ff4757" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, event, isFavorite]);

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleFavoritePress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(event.id);
  };

  const handleSharePress = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title} on ${formatDate(
          event.date
        )} at ${event.location}`,
        url: `https://events.app/event/${event.id}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleBuyTickets = () => {
    const ticket: Ticket = {
      id: Date.now().toString(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      quantity: ticketQuantity,
      totalPrice: event.price * ticketQuantity,
      purchaseDate: new Date().toISOString(),
      qrCode: `EVENT_${event.id}_TICKET_${Date.now()}`,
    };

    addTicket(ticket);

    Alert.alert(
      "Tickets Purchased!",
      "You've successfully purchased tickets.",
      [
        {
          text: "View Tickets",
          onPress: () => navigation.navigate("Main", { screen: "My Tickets" }),
        }, // Navigate to a specific tab
        { text: "OK", style: "default" },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>Organized by {event.organizer}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={20} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Date & Time</Text>
                <Text style={styles.infoText}>{formatDate(event.date)}</Text>
                <Text style={styles.infoSubtext}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="pin-outline" size={20} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Location</Text>
                <Text style={styles.infoText}>{event.location}</Text>
                <Text style={styles.infoSubtext}>{event.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="people" size={20} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Attendees</Text>
                <Text style={styles.infoText}>{event.attendees} going</Text>
                <Text style={styles.infoSubtext}>
                  {event.capacity - event.attendees} spots left
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.ticketSelector}>
          <Text style={styles.ticketLabel}>Tickets</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{ticketQuantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setTicketQuantity(ticketQuantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.purchaseSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>
              ${(event.price * ticketQuantity).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyTickets}>
            <Icon name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.buyButtonText}>Buy Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 300,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  categoryBadge: {
    position: "absolute",
    top: 100,
    left: 16,
    backgroundColor: "rgba(99, 102, 241, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 36,
  },
  organizer: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 14,
    color: "#666",
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  tagsSection: {
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  tagText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  bottomSection: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 20,
    paddingBottom: 32,
  },
  ticketSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  ticketLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6366f1",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginHorizontal: 20,
  },
  purchaseSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  buyButton: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
  },
});
