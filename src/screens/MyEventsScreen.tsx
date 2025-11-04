// src/screens/MyEventsScreen.tsx
import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyEvents } from '../stores/my-event-store';
import { Loader } from '../components/LazyLoaders/loader';
import { EmptyState } from '../components/ui/Errors/EmptyState';
import MyEventCard from '../components/ui/Cards/MyEventCard';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { RootStackParamList } from '../navigation/AppNavigator';
import FeatherIcon from 'react-native-vector-icons/Feather';
import ScreenHeader from '../components/ui/ScreenHeader';
import TabSelector from '../components/navigation/TabSelector';
import {
  TabKey,
  TabItem,
  TAB_KEYS,
  TAB_CONFIG,
} from '../types/navigation';
import { filterEventsByDate } from '../utils/domain/filterUtils'; 

// Define the navigation tab
// Note: The screen name here must match the one in TabNavigator.tsx
type MyEventsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'My Events'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function MyEventsScreen() {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  const { myEvents, isLoading, loadMyEvents, deleteEvent } = useMyEvents();
  const [selectedTab, setSelectedTab] = useState<TabKey>(TAB_KEYS.UPCOMING);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Memoize the filtering of events into upcoming and past
  const { upcoming: upcomingEvents, past: pastEvents } = useMemo(() => {
    const now = new Date().getTime(); // Get timestamp once
    // Call the centralized utility function
    return filterEventsByDate(myEvents, now);
  }, [myEvents]); // Re-runs only when myEvents changes

  // Data to pass to the FlatList based on the selected tab
  const dataForList =
    selectedTab === TAB_KEYS.UPCOMING ? upcomingEvents : pastEvents;

  // Tabs data for the reusable component
  const tabs: TabItem[] = [
    {
      key: TAB_KEYS.UPCOMING,
      title: TAB_CONFIG[TAB_KEYS.UPCOMING].title,
      count: upcomingEvents.length,
    },
    {
      key: TAB_KEYS.PAST,
      title: TAB_CONFIG[TAB_KEYS.PAST].title,
      count: pastEvents.length,
    },
  ];

  // The "Create Event" button to pass to the header
  const createEventButton = (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => navigation.navigate('EventForm', {})}
    >
      <FeatherIcon name="plus" size={24} color="#8b5cf6" />
    </TouchableOpacity>
  );

  const handleRefresh = useCallback(() => {
    loadMyEvents();
  }, [loadMyEvents]);

  const handleDeletePress = (eventId: number, title: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(eventId),
        },
      ]
    );
  };

  const handleEditPress = (eventId: number) => {
    navigation.navigate('EventForm', { eventId });
  };

  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetails', {
      id: eventId,
      initialIsFavorite: false,
    });
  };

  const renderEmptyList = () => (
    <EmptyState
      icon={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'calendar-outline'
          : 'checkmark-done-outline'
      }
      title={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'No Upcoming Events'
          : 'No Past Events'
      }
      message={
        selectedTab === TAB_KEYS.UPCOMING
          ? 'You have no events scheduled for the future.'
          : 'You have no completed events.'
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="My Events"
        subtitle={`${myEvents.length} events created`}
        rightContent={createEventButton}
      />

      <TabSelector
        tabs={tabs}
        selectedTabKey={selectedTab}
        onSelectTab={(key) => setSelectedTab(key as TabKey)}
      />

      {myEvents.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Events Found"
          message="You haven't organized any events yet."
        />
      ) : (
        <FlatList
          data={dataForList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MyEventCard
              event={item}
              onPress={() => handleEventPress(item.id)}
              onEdit={() => handleEditPress(item.id)}
              onDelete={() => handleDeletePress(item.id, item.title)}
            />
          )}
          contentContainerStyle={[
              styles.listContent,
              dataForList.length === 0 && styles.emptyStateContainer,
            ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    marginTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
});

