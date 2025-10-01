// src/screens/TicketsScreen.tsx
import React, { useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";
import TicketCard from '@/src/components/TicketCard';
import { useTickets } from '@/src/hooks/tickets-store';
import { Ticket } from '@/src/types/event';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { TabParamList } from '../navigation/TabNavigator';

type TicketsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'My Tickets'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function TicketsScreen() {
  const navigation = useNavigation<TicketsScreenNavigationProp>();
  const { tickets, isLoading, loadTickets, loadFavorites } = useTickets();
  
    useEffect(() => {
    loadTickets();
    loadFavorites();
  }, [loadTickets, loadFavorites]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Tickets',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
    });
  }, [navigation]);

  const handleTicketPress = (ticket: Ticket) => {
    navigation.navigate('TicketDetails', { id: ticket.id });
  };

   if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="ticket-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your purchased tickets will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TicketCard
                ticket={item}
                onPress={() => handleTicketPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});

useTickets.getState().loadTickets();
useTickets.getState().loadFavorites();