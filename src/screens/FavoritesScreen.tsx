import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTickets } from '@/src/hooks/tickets-store'; 
import { MOCK_EVENTS } from '@/src/constants/events';
import { Event } from '@/src/types/event';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import EventCard from '@/src/components/EventCard';

type FavoritesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'My Favorites'>,
  NativeStackNavigationProp<RootStackParamList>
>;
export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favorites, loadFavorites } = useTickets();
  // Mount Favorites 
    useEffect(() => {
      loadFavorites();
    }, [ loadFavorites]);
    useLayoutEffect(() => {
      navigation.setOptions({
        title: 'My Favorites',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
      });
    }, [navigation]);

  const favoriteEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => favorites.includes(event.id));
  }, [favorites]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name='heart-outline' size={64} color="#e0e0e0" />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring events and tap the heart icon to save your favorites
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Discover')}
      >
        <Text style={styles.exploreButtonText}>Explore Events</Text>
      </TouchableOpacity>
    </View>
  );

    const handleEventPress = (event: Event) => {
      // Get the latest state directly from the store right now
      const currentFavorites = useTickets.getState().favorites;
      const isFavorite = currentFavorites.includes(event.id);
  
      navigation.navigate('EventDetails', {
        id: event.id,
        initialIsFavorite: isFavorite,
      });
    };
  
  return (
    <View style={styles.container}>      
      {favoriteEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favoriteEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard 
              event={item} 
              onPress={() => handleEventPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
