// src/screens/TicketScreen.tsx
import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TicketCard from '../components/ui/Cards/TicketCard';
import { Ticket } from '../types/ticket';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { Loader } from '../components/LazyLoaders/loader';
import { EmptyState } from '../components/ui/Errors/EmptyState';
import ScreenHeader from '../components/ui/ScreenHeader';
import TabSelector from '../components/navigation/TabSelector';
import {
  TabKey,
  TabItem,
  TAB_KEYS,
  TAB_CONFIG,
} from '../types/TabSegment';
import { filterTicketsByDate } from '../utils/domain/filterUtils';
import { useTicketsQuery } from '../hooks'; 

// Define the navigation tab
type TicketsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'My Tickets'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function TicketsScreen() {
  const navigation = useNavigation<TicketsScreenNavigationProp>();

  // --- USE REACT QUERY ---
  const {
    data: tickets = [], // Default to empty array
    isLoading,
    refetch,
    isRefetching, // Use this for refresh control
  } = useTicketsQuery();
  // --- END REACT QUERY ---

  const [selectedTab, setSelectedTab] = useState<TabKey>(TAB_KEYS.UPCOMING);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // This logic remains exactly the same
  const { upcoming: upcomingTickets, past: pastTickets } = useMemo(() => {
    const now = new Date().getTime();
    return filterTicketsByDate(tickets, now);
  }, [tickets]);

  const dataForList =
    selectedTab === TAB_KEYS.UPCOMING ? upcomingTickets : pastTickets;

  const tabs: TabItem[] = [
    {
      key: TAB_KEYS.UPCOMING,
      title: TAB_CONFIG[TAB_KEYS.UPCOMING].title,
      count: upcomingTickets.length,
    },
    {
      key: TAB_KEYS.PAST,
      title: TAB_CONFIG[TAB_KEYS.PAST].title,
      count: pastTickets.length,
    },
  ];

  const handleTicketPress = (ticket: Ticket) => {
    navigation.navigate('TicketDetails', { id: ticket.id });
  };

  // Use RQ's `refetch` function
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderEmptyList = () => (
    <EmptyState
      icon={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'ticket-outline'
          : 'checkmark-done-outline'
      }
      title={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'No Upcoming Tickets'
          : 'No Past Tickets'
      }
      message={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'Tickets for future events will appear here.'
          : 'Your completed event tickets.'
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Tickets"
        subtitle={`${tickets.length} purchased ticket${
          tickets.length !== 1 ? 's' : ''
        }`}
      />

      <TabSelector
        tabs={tabs}
        selectedTabKey={selectedTab}
        onSelectTab={(key) => setSelectedTab(key as TabKey)}
      />

      <View style={styles.content}>
        {tickets.length === 0 ? (
          <EmptyState
            icon="ticket-outline"
            title="No Tickets Yet"
            message="Your purchased tickets will appear here."
          />
        ) : (
          <FlatList
            data={dataForList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TicketCard
                ticket={item}
                onPress={() => handleTicketPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              dataForList.length === 0 && styles.emptyStateContainer,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching} // Use isRefetching
                onRefresh={handleRefresh}
                tintColor="#6366f1"
              />
            }
            ListEmptyComponent={renderEmptyList}
          />
        )}
      </View>
    </View>
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
  listContent: {
    marginHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
});