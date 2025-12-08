import React, { useState, useLayoutEffect, useCallback } from "react";
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
  Animated,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { RootStackParamList } from "../navigation/AppNavigator";
import { formatFullDate, formatTime } from "../utils/formatters/dateFormatter";
import { useAuth } from "../stores/auth-store";
import { PurchaseRequest } from "../services/api/ticketsService";
import { useEventByIdQuery } from "../hooks/";
import { useTicketsQuery, usePurchaseTicket } from "../hooks/";
import { useFavoritesQuery, useAddFavorite, useRemoveFavorite } from "../hooks";
import useEventSubscription from "../hooks/data/useEventSubscription";
import { Colors } from "../constants/colors";

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
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const { session } = useAuth();
  const scrollY = new Animated.Value(0);

  // 2. Activate Real-time Subscription
  useEventSubscription(id);

  // REACT QUERY DATA
  const { data: event, isLoading, isError } = useEventByIdQuery(id);

  const { data: userTickets = [] } = useTicketsQuery();
  const { data: favoriteEventIds = [] } = useFavoritesQuery();

  // REACT QUERY MUTATIONS
  const { mutate: purchaseTickets, isPending: isBuying } = usePurchaseTicket();
  const { mutate: addFavorite } = useAddFavorite();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const isFavorite = favoriteEventIds.includes(id);

  const userTicketsForEvent = userTickets.filter(
    (ticket) => ticket.eventId === id
  ).length;

  const handleSharePress = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out this event: ${event.title} on ${formatFullDate(
          event.startTime
        )} at ${event.location}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, [event]);

  const handleFavoritePress = useCallback(() => {
    if (!session) {
      Alert.alert("Login Required", "Please log in to save events.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    if (!event) return;

    if (isFavorite) {
      removeFavorite(event.id);
    } else {
      addFavorite(event.id);
    }
  }, [session, isFavorite, event, removeFavorite, addFavorite, navigation]);
  const HeaderRight = useCallback(
    () => (
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
    [handleSharePress, handleFavoritePress, isFavorite]
  );

  useLayoutEffect(() => {
    if (!event) return;

    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerTintColor: "#000000ff",
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
      headerRight: HeaderRight, // Pass the stable component
    });
  }, [navigation, event, HeaderRight]);

  const handleBuyTickets = async () => {
    if (!event) return;
    if (!session) {
      Alert.alert("Login Required", "Please log in to purchase tickets.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    const availableSlot = event.availableSlot ?? 0;
    const userMaxPurchase = event.userMaxTicketPurchase ?? 0;
    const remainingForUser = userMaxPurchase - userTicketsForEvent;

    if (ticketQuantity > availableSlot) {
      Alert.alert(
        "Not Enough Tickets",
        `Sorry, only ${availableSlot} tickets are left.`
      );
      return;
    }
    if (ticketQuantity > remainingForUser) {
      Alert.alert(
        "Ticket Limit Exceeded",
        `You can only purchase ${remainingForUser} more ticket(s).`
      );
      return;
    }

    const purchaseRequest: PurchaseRequest = {
      eventId: event.id,
      quantity: ticketQuantity,
      eventTitle: event.title,
      eventDate: event.startTime,
      eventTime: formatTime(event.startTime),
      eventLocation: event.location,
      totalPrice: (event.price ?? 0) * ticketQuantity,
    };

    purchaseTickets(purchaseRequest, {
      onSuccess: () => {
        navigation.navigate("Main", { screen: "My Tickets" });
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (isError || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Event details could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use defaults only if undefined to prevent NaN
  const availableSlot =
    typeof event.availableSlot === "number" ? event.availableSlot : 0;
  const userMaxPurchase =
    typeof event.userMaxTicketPurchase === "number"
      ? event.userMaxTicketPurchase
      : 0;

  // Logic variables for UI state
  const isSoldOut = availableSlot <= 0;
  const isEventClosed = !!event.isClosed;
  const isPending = event.isApproved === false;

  const remainingForUser = userMaxPurchase - userTicketsForEvent;
  const safeRemainingForUser = Math.max(0, remainingForUser);

  const maxQuantity = Math.min(availableSlot, safeRemainingForUser);

  let purchaseMessage = "Buy Tickets";
  let isButtonDisabled = isBuying;

  if (isPending) {
    purchaseMessage = "Under Review";
    isButtonDisabled = true;
  } else if (isSoldOut) {
    purchaseMessage = "Sold Out";
    isButtonDisabled = true;
  } else if (safeRemainingForUser <= 0) {
    purchaseMessage = "Ticket Limit Reached";
    isButtonDisabled = true;
  } else if (isEventClosed) {
    purchaseMessage = "Event Closed";
    isButtonDisabled = true;
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.blurHeader, { opacity: headerOpacity }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={15}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlurFallback]} />
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          />

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>
            Organized by {event.organizer?.fullName || "Unknown User"}
          </Text>

          {/* Pending Badge - displayed inline under organizer */}
          {isPending && (
            <View style={styles.pendingBadge}>
              <Icon
                name="time-outline"
                size={16}
                color="#fff"
                style={styles.pendingIcon}
              />
              <Text style={styles.pendingText}>Under Review</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Date & Time</Text>
                <Text style={styles.infoText}>
                  {formatFullDate(event.startTime)}
                </Text>
                <Text style={styles.infoSubtext}>
                  {formatTime(event.startTime)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="pin-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Location</Text>
                <Text style={styles.infoText}>{event.location}</Text>
                <Text style={styles.infoSubtext}>{event.address}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="people-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Attendees</Text>
                <Text style={styles.infoText}>{event.attendees} going</Text>
                <Text style={styles.infoSubtext}>
                  {isSoldOut ? "Event is full" : `${availableSlot} spots left`}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="ticket-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Ticket Limit</Text>
                <Text
                  style={styles.infoText}
                >{`Max ${userMaxPurchase} per person`}</Text>
                <Text
                  style={styles.infoSubtext}
                >{`You have ${userTicketsForEvent} ticket(s)`}</Text>
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
        {/* Disable purchasing logic if Pending, Closed, Sold Out, or Limit Reached */}
        {!isPending &&
          !isEventClosed &&
          !isSoldOut &&
          safeRemainingForUser > 0 && (
            <View style={styles.ticketSelector}>
              <Text style={styles.ticketLabel}>Tickets</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setTicketQuantity(Math.max(1, ticketQuantity - 1))
                  }
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{ticketQuantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setTicketQuantity(Math.min(ticketQuantity + 1, maxQuantity))
                  }
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        <View style={styles.purchaseSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>
              {isPending || isSoldOut || safeRemainingForUser <= 0
                ? "$ --"
                : `$${((event.price ?? 0) * ticketQuantity).toFixed(2)}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.buyButton,
              isButtonDisabled && styles.disabledButton,
            ]}
            onPress={handleBuyTickets}
            disabled={isButtonDisabled}
          >
            {isBuying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                {isPending ? (
                  <Icon name="time-outline" size={20} color={Colors.white} />
                ) : (
                  <Icon
                    name={isSoldOut ? "close-circle-outline" : "ticket-outline"}
                    size={20}
                    color={Colors.white}
                  />
                )}
                <Text style={styles.buyButtonText}>{purchaseMessage}</Text>
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
    backgroundColor: Colors.white,
  },
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 100 : 60,
    zIndex: 10,
  },
  androidBlurFallback: {
    backgroundColor: Colors.whiteTransparent85,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
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
    top: 60,
    left: 16,
    backgroundColor: Colors.primaryAlpha90,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  pendingBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  pendingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  pendingIcon: {
    marginRight: 4,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    backgroundColor: Colors.blackTransparent,
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 36,
  },
  organizer: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
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
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: Colors.neutral333,
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.neutral333,
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
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  bottomSection: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
    color: Colors.textPrimary,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  buyButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.transparent,
    elevation: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
