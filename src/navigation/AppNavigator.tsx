// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TabParamList } from './TabNavigator'; 
import TabNavigator from './TabNavigator';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';


// This is the heart of your type-safe navigation
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  EventDetails: { id: number; initialIsFavorite: boolean};
  TicketDetails: { id: number };
  Login: undefined;
  Register: undefined;
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
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
         <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
        />
      </Stack.Navigator>

  );
}