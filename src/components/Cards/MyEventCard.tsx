import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Event } from '../../types/event';
import { formatFullDate, formatTime } from '../../utils/dateFormatter';

type MyEventCardProps = {
  event: Event;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function MyEventCard({
  event,
  onPress,
  onEdit,
  onDelete,
}: MyEventCardProps) {
  return (
    <TouchableOpacity style={styles.shadowContainer} onPress={onPress}>
      <View style={styles.card}>
        {/* Top section: Image + Details */}
        <View style={styles.topContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
          <View style={styles.detailsContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.detailRow}>
              <Icon
                name="calendar-outline"
                size={16}
                color="#666" // Neutral color
              />
              <Text style={styles.detailText}>
                {formatFullDate(event.startTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon
                name="location-outline"
                size={16}
                color="#666" // Neutral color
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom section: Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={onEdit}>
            <Icon name="pencil-outline" size={18} color="#6366f1" />
            <Text style={[styles.actionText, styles.editText]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}>
            <Icon name="trash-outline" size={18} color="#ff4757" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android Elevation
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden', // Clips the corners
    backgroundColor: '#fff', // Solid white background
  },
  topContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0', // Light gray placeholder
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a', // Dark text
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666', // Medium gray text
    marginLeft: 8,
    flexShrink: 1, 
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef', // Light gray divider
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8f9fa', // Very light gray background
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: '#e9ecef', // Divider between buttons
  },
  editText: {
    color: '#6366f1', // Primary app color
  },
  deleteButton: {
    // No specific style, just text color
  },
  deleteText: {
    color: '#ff4757', // Danger color
  },
});