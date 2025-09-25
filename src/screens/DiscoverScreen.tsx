// src/screens/DiscoverScreen.tsx
import React, { useState, useMemo, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EventCard from '../../src/components/EventCard';
import SearchBar from '../../src/components/SearchBar';
import CategoryFilter from '../../src/components/CategoryFilter';
import { MOCK_EVENTS } from '../../src/constants/events';
import { Event } from '../../src/types/event';
import { RootStackParamList } from '../navigation/AppNavigator'; // We will create this
import { TabParamList } from '../navigation/TabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Define the navigation prop type for this screen
type DiscoverScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Discover'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // This logic for setting header options is moved from the old <Stack.Screen>
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Discover Events',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
      headerShadowVisible: false, // Optional: for a cleaner look
    });
  }, [navigation]);


  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((event: Event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleEventPress = (event: Event) => {
    // CHANGE: Use navigation.navigate instead of router.push
    navigation.navigate('EventDetails', { id: event.id });
  };

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={handleFilterPress}
        />
        
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => handleEventPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});