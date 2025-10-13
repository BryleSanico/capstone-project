import React, { useState, useLayoutEffect, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import HapticFeedback from "react-native-haptic-feedback";
import { useFavorites } from "../stores/favorites-store";
import { useAuth } from "../stores/auth-store";
import { useEvents } from "../stores/event-store";
import { Ticket } from "../types/ticket";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTickets } from "../stores/tickets-store";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
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
  const { id } = route.params;
  const [isBuying, setIsBuying] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  const { session } = useAuth();
  const { currentEvent: event, isLoading, fetchEventById } = useEvents();
  const { addTicket } = useTickets();
  const { toggleFavorite, favorites } = useFavorites();
  const isFavorite = favorites.includes(id);

  // triggers the centralized, cache-first fetching logic in the store.
  useEffect(() => {
    fetchEventById(id);
  }, [id, fetchEventById]);

  useLayoutEffect(() => {
    if (!event) return;

    const handleFavoritePress = () => {
        if (!session) {
        Alert.alert(
          "Login Required",
          "Please log in to save events to your favorites.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => navigation.navigate("Login") },
          ]
        );
        return;
      }

      if (Platform.OS !== "web") {
        HapticFeedback.trigger("impactLight", {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
      toggleFavorite(event);
    };

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
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#ff4757" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, event, isFavorite, toggleFavorite]);

  const handleSharePress = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out this event: ${event.title} on ${formatDate(
          event.startTime
        )} at ${event.location}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleBuyTickets = async () => {
    if (!event) return;
    if (!session) {
      Alert.alert(
        "Login Required",
        "Please log in to purchase tickets.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }
    setIsBuying(true);

    const date = new Date(event.startTime);
    const ticketData: Omit<Ticket, 'id' | 'purchaseDate'> = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: date.toDateString(),
      eventTime: date.toTimeString(),
      eventLocation: event.location,
      quantity: ticketQuantity,
      totalPrice: event.price * ticketQuantity,
      qrCode: `EVENT_${event.id}_USER_${session.user.id}`,
    };

    const success = await addTicket(ticketData);
    setIsBuying(false);

    if (success) {
      Alert.alert(
        "Tickets Purchased!",
        "You've successfully purchased your tickets.",
        [
          {
            text: "View My Tickets",
            onPress: () => navigation.navigate("Main", { screen: "My Tickets" }),
          },
          { text: "OK", style: "default" },
        ]
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }
  
  // If null, it means it not in the cache and couldn't be fetched (e.g., offline and never seen).
  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event details not available offline.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.organizer}>
            Organized by {event.organizer?.fullName || "Unknown User"}
          </Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={20} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Date & Time</Text>
                <Text style={styles.infoText}>
                  {formatDate(event.startTime)}
                </Text>
                <Text style={styles.infoSubtext}>
                  {formatTime(event.startTime)}
                </Text>
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
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handleBuyTickets}
            disabled={isBuying}
          >
            {isBuying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="ticket-outline" size={20} color="#fff" />
                <Text style={styles.buyButtonText}>Buy Tickets</Text>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
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
    paddingHorizontal: 20,
    paddingTop: 20,
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});

