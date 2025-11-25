import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

// Screens
import EventDetailsScreen from '../screens/EventDetailsScreen';
import AdminTabNavigator, { AdminTabParamList } from './AdminTabNavigator';

// Types
export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  EventDetails: { id: number; initialIsFavorite: boolean };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

// Main Admin Stack (Wraps Tabs + Details)
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen 
        name="AdminTabs" 
        component={AdminTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen} 
        options={{
          headerTintColor: 'black', 
        }}
      />
    </Stack.Navigator>
  );
}