import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import QRCode from "react-native-qrcode-svg";
import { useTickets } from "@/src/hooks/tickets-store";
import { RootStackParamList } from "@/src/navigation/AppNavigator"; 

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type TicketDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "TicketDetails" 
>;
type TicketDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TicketDetails"
>;

export default function TicketDetailsScreen() {
  const route = useRoute<TicketDetailsScreenRouteProp>();
  const navigation = useNavigation<TicketDetailsScreenNavigationProp>();

  const { id } = route.params;
  const { tickets } = useTickets();

  const ticket = tickets.find((t) => t.id === id);

  useLayoutEffect(() => {
    if (ticket) {
      navigation.setOptions({
        title: "My Ticket",
        headerRight: () => (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareTicket}
            >
              <Icon name="share-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDownloadTicket}
            >
              <Icon name="download-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        ),
      });
    } else {
      // If the ticket is NOT found, just set the title
      navigation.setOptions({
        title: "Ticket Not Found",
      });
    }
  }, [navigation, ticket]); // Re-run this effect if navigation or ticket changes


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // These handlers need to be defined within the component scope so they can be
  // passed to navigation.setOptions
  const handleShareTicket = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `My ticket for ${ticket.eventTitle} on ${formatDate(
          ticket.eventDate
        )}`,
      });
    } catch (error) {
      console.error("Error sharing ticket:", error);
    }
  };

  const handleDownloadTicket = () => {
    Alert.alert(
      "Download Ticket",
      "Ticket download functionality would be implemented here.",
      [{ text: "OK" }]
    );
  };

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If the ticket is found, render the ticket details
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            style={styles.ticketCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>
            <Text style={styles.quantity}>
              {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""}
            </Text>
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailText}>
                    {formatDate(ticket.eventDate)}
                  </Text>
                  <Text style={styles.detailSubtext}>{ticket.eventTime}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Icon
                  name="pin-outline"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailText}>{ticket.eventLocation}</Text>
                </View>
              </View>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.totalPaid}>
                Total Paid: ${ticket.totalPrice.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Entry QR Code</Text>
            <Text style={styles.qrSubtitle}>
              Show this code at the event entrance
            </Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={ticket.qrCode}
                size={200}
                backgroundColor="#fff"
                color="#1a1a1a"
              />
            </View>
            <Text style={styles.qrCode}>{ticket.qrCode}</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <Text style={styles.infoText}>
              • Please arrive 30 minutes before the event starts{"\n"}• This QR
              code is your entry ticket - keep it safe{"\n"}• Screenshots of
              this ticket are valid{"\n"}• Contact support if you have any
              issues
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  ticketCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 32,
    margin: 15,
    marginLeft: 25,
    marginTop: 25,
  },
  quantity: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 20,
    marginLeft: 25,
  },
  eventDetails: {
    marginBottom: 0,
    marginLeft: 30,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 16,
    margin: 25,
  },
  totalPaid: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  qrSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  qrCode: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
