// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/FontAwesome";
import DiscoverScreen from '../screens/DiscoverScreen';
import TicketsScreen from '../screens/TicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

export type TabParamList = {
  Discover: undefined;
  'My Favorites': undefined;
  'My Tickets': undefined;
  Profile: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>(); 
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#999',
        headerShown: true, 
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 15,
          paddingRight: 15,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          textAlign: "center"
        },
        tabBarItemStyle: {
          flex: 1,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="My Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: "Favorites",
          tabBarIcon: ({ color, size }) => <Icon name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="My Tickets"
        component={TicketsScreen}
        options={{
          tabBarLabel: "My Tickets",
          tabBarIcon: ({ color, size }) => <Icon name="ticket-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon2 name="user-o" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}