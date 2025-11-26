import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Event } from "../../../types/event";
import { formatFullDate } from "../../../utils/formatters/dateFormatter";

type ActionableEventCardProps = {
  event: Event;
  onPress: () => void;
  // Legacy props for backward compatibility
  onEdit?: () => void;
  onDelete?: () => void;
  renderActions?: (event: Event) => React.ReactNode;
  containerStyle?: ViewStyle;
};

export default function ActionableEventCard({
  event,
  onPress,
  onEdit,
  onDelete,
  renderActions,
  containerStyle,
}: ActionableEventCardProps) {
  const renderDefaultActions = () => (
    <View style={styles.actionsContainer}>
      {onEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
        >
          <Icon name="pencil-outline" size={18} color="#6366f1" />
          <Text style={[styles.actionText, styles.editText]}>Edit</Text>
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Icon name="trash-outline" size={18} color="#ff4757" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.shadowContainer, containerStyle]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Top section: Image + Details */}
        <View style={styles.topContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
          <View style={styles.detailsContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.detailRow}>
              <Icon name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatFullDate(event.startTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.organizerText}>
                by {event.organizer?.fullName || "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom section: Action Buttons (Custom or Default) */}
        {renderActions ? renderActions(event) : renderDefaultActions()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android Elevation
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  topContainer: {
    flexDirection: "row",
    padding: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    flexShrink: 1,
  },
  organizerText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Platform.OS === "ios" ? "#e9ecef" : "#e1e2e3ff",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor:
      Platform.OS === "ios" ? "#f8f9fa" : "rgba(240, 242, 244, 1)",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: Platform.OS === "ios" ? "#e9ecef" : "#e1e2e3ff",
  },
  editText: {
    color: "#6366f1",
  },
  deleteButton: {},
  deleteText: {
    color: "#ff4757",
  },
});
