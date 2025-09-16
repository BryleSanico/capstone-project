import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ticket as TicketIcon } from 'lucide-react-native';
import TicketCard from '@/components/TicketCard';
import { useTickets } from '@/hooks/tickets-store';
import { Ticket } from '@/types/event';

export default function TicketsScreen() {
  const { tickets, isLoading } = useTickets();

  const handleTicketPress = (ticket: Ticket) => {
    router.push({
      pathname: '/ticket/[id]',
      params: { id: ticket.id }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Tickets' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'My Tickets',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', fontSize: 20 }
        }} 
      />
      
      <View style={styles.content}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <TicketIcon size={64} color="#ccc" />
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