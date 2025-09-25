import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from "react-native-vector-icons/Ionicons";
import { Event } from '@/src/types/event';
import { useTickets } from '@/src/hooks/tickets-store';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

export default function EventCard({ event, onPress }: EventCardProps) {
  const { toggleFavorite, isFavorite } = useTickets();
  const isEventFavorite = isFavorite(event.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(event.id);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isEventFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isEventFavorite ? "#ff4757" : "#fff"}
            />
          </TouchableOpacity>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          
          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {formatDate(event.date)} • {event.time}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="pin-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="people-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{event.attendees} attending</Text>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.price}>${event.price}</Text>
            <Text style={styles.organizer}>by {event.organizer}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  organizer: {
    fontSize: 12,
    color: '#999',
  },
});