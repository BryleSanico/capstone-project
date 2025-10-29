// src/screens/MyEventsScreen.tsx
import React, { useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyEvents } from '../stores/my-event-store';
import { Loader } from '../components/loaders/loader';
import { EmptyState } from '../components/Errors/EmptyState';
import MyEventCard from '../components/MyEventCard';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from "react-native-vector-icons/Ionicons";

// Define the navigation tab
// Note: The screen name here must match the one in TabNavigator.tsx
type MyEventsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "My Events">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function MyEventsScreen() {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  const { myEvents, isLoading, loadMyEvents, deleteEvent } = useMyEvents();

 useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Organized Events',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
      // --- ADD CREATE BUTTON ---
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EventForm', {})}> 
           {/* Pass empty params for Create mode */}
          <Icon name="add-circle-outline" size={26} color="#6366f1" />
        </TouchableOpacity>
      ),
      // --- END ADD ---
    });
  }, [navigation]);

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
          onPress: () => deleteEvent(eventId) 
        },
      ]
    );
  };
  
  const handleEditPress = (eventId: number) => {
    navigation.navigate('EventForm', { eventId });
  };
  
  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetails', { id: eventId, initialIsFavorite: false });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Loader size={150} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {myEvents.length === 0 ? (
        <EmptyState 
          icon="calendar-outline" 
          title="No Events Found" 
          message="You haven't organized any events yet."
          // You could add an action to navigate to a "Create Event" screen
        />
      ) : (
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MyEventCard
              event={item}
              onPress={() => handleEventPress(item.id)}
              onEdit={() => handleEditPress(item.id)}
              onDelete={() => handleDeletePress(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#6366f1" />
          }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});