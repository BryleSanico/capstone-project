import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Loader } from '../components/LazyLoaders/loader';
import { EmptyState } from '../components/ui/Errors/EmptyState';
import ActionableEventCard from '../components/ui/Cards/ActionableEventCard';
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
} from '../types/TabSegment';
import { filterEventsByDate } from '../utils/domain/filterUtils';
import { useMyEventsQuery, useDeleteEvent } from '../hooks';

type MyEventsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'My Events'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function MyEventsScreen() {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  
  const { 
    data: myEvents = [], 
    isLoading, 
    isRefetching, 
    refetch 
  } = useMyEventsQuery();
  
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const [selectedTab, setSelectedTab] = useState<TabKey>(TAB_KEYS.UPCOMING);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const { upcoming: upcomingEvents, past: pastEvents, pending: pendingEvents } = useMemo(() => {
    const now = new Date().getTime();
    return filterEventsByDate(myEvents, now);
  }, [myEvents]);

  const dataForList = useMemo(() => {
    switch (selectedTab) {
      case TAB_KEYS.UPCOMING:
        return upcomingEvents;
      case TAB_KEYS.PAST:
        return pastEvents;
      case TAB_KEYS.PENDING:
        return pendingEvents;
      default:
        return upcomingEvents;
    }
  }, [selectedTab, upcomingEvents, pastEvents, pendingEvents]);

  const tabs: TabItem[] = [
    {
      key: TAB_KEYS.UPCOMING,
      title: TAB_CONFIG[TAB_KEYS.UPCOMING].title,
      count: upcomingEvents.length,
    },
    {
      key: TAB_KEYS.PENDING,
      title: TAB_CONFIG[TAB_KEYS.PENDING].title,
      count: pendingEvents.length,
    },
    {
      key: TAB_KEYS.PAST,
      title: TAB_CONFIG[TAB_KEYS.PAST].title,
      count: pastEvents.length,
    },
  ];

  const createEventButton = (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => navigation.navigate('EventForm', {})}
    >
      <FeatherIcon name="plus" size={24} color="#8b5cf6" />
    </TouchableOpacity>
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeletePress = (eventId: number, title: string) => {
    if (isDeleting) return;
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
      ],
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

  const renderEmptyList = () => {
    let icon = 'calendar-outline';
    let title = 'No Events Found';
    let message = "You haven't organized any events yet.";

    if (selectedTab === TAB_KEYS.UPCOMING) {
      title = 'No Upcoming Events';
      message = 'You have no approved events scheduled for the future.';
    } else if (selectedTab === TAB_KEYS.PENDING) {
      icon = 'time-outline';
      title = 'No Pending Events';
      message = 'All your events have been approved or you haven\'t submitted any recently.';
    } else if (selectedTab === TAB_KEYS.PAST) {
      icon = 'checkmark-done-outline';
      title = 'No Past Events';
      message = 'You have no completed events.';
    }

    return (
      <EmptyState
        icon={icon}
        title={title}
        message={message}
      />
    );
  };

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
            <ActionableEventCard
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
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#f8f9fa' : '#e1e1e8ff',
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