// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/FontAwesome";

import DiscoverScreen from '../screens/DiscoverScreen';
import TicketsScreen from '../screens/TicketsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Discover: undefined;
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
        headerShown: false, // Headers are now managed by the Stack Navigator
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="My Tickets"
        component={TicketsScreen}
        options={{
          title: "My Tickets",
          tabBarIcon: ({ color, size }) => <Icon name="ticket-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Icon2 name="user-o" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}