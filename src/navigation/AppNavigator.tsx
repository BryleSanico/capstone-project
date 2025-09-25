// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import type { TabParamList } from './TabNavigator'; 
import EventDetailsScreen from '../screens/EventDetailsScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';

export type RootStackParamList = {
  // ✅ UPDATE THE TYPE FOR 'Main'
  Main: NavigatorScreenParams<TabParamList>;
  EventDetails: { id: string };
  TicketDetails: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventDetails" 
          component={EventDetailsScreen} 
        />
        <Stack.Screen 
          name="TicketDetails" 
          component={TicketDetailsScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}