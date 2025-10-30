import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from "react-native-vector-icons/Ionicons";
import { Ticket } from '@/src/types/ticket';
import { formatDateMMDDYY } from '../utils/dateFormatter';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
}

export default function TicketCard({ ticket, onPress }: TicketCardProps) {

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        // colors={['#6366f1', '#5c8dfeff']}
        // colors={['#5a72ea', '#7b9aff']}
        // colors={['#4f46e5', '#3b82f6']}
        colors={['#5865f2', '#8897f5']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.ticketInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>{ticket.eventTitle}</Text>
            {/* <Text style={styles.quantity}>{ticket.} ticket{ticket.quantity > 1 ? 's' : ''}</Text> */}
          </View>
          <View style={styles.qrIcon}>
            <Icon name="qr-code-outline" size={24} color="#fff" />
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText}>
              {formatDateMMDDYY(ticket.eventDate)} • {ticket.eventTime}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="pin-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText} numberOfLines={1}>
              {ticket.eventLocation}
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.price}>${ticket.totalPrice.toFixed(2)}</Text>
          <Text style={styles.tapToView}>Tap to view QR code</Text>
        </View>
        
        <View style={styles.ticketHoles}>
          <View style={styles.hole} />
          <View style={styles.hole} />
          <View style={styles.hole} />
          <View style={styles.hole} />
          <View style={styles.hole} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginVertical: 10,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginLeft: 25,
    marginTop: 20
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 24,
  },
  quantity: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  qrIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 30
  },
  details: {
    marginBottom: 16,
    marginLeft: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 25,
  },
  tapToView: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    paddingRight: 30
  },
  ticketHoles: {
    position: 'absolute',
    right: -6,
    top: '40%',
    transform: [{ translateY: -40 }],
    gap: 8,
  },
  hole: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Platform.OS === "ios" ? '#dde4eaff' : '#e8eff5ff',
  },
});