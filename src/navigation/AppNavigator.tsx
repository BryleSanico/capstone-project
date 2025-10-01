// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TabParamList } from './TabNavigator'; 
import TabNavigator from './TabNavigator';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
// import ModalScreen from '../screens/ModalScreen'; // If you create this
// import NotFoundScreen from '../screens/NotFoundScreen'; // For handling not found

// This is the heart of your type-safe navigation
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  EventDetails: { id: string; initialIsFavorite: boolean};
  TicketDetails: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (

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
        {/*
        <Stack.Screen name="Modal" component={ModalScreen} options={{ presentation: "modal" }} />
        */}
      </Stack.Navigator>

  );
}