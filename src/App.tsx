// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TicketsProvider } from '../src/hooks/tickets-store';
import AppNavigator from './navigation/AppNavigator';

const queryClient = new QueryClient();

export default function App() {
  // We don't need the useEffect for SplashScreen here, as it's typically handled
  // in the native part of a bare app, or can be called here if needed.

  return (
    <QueryClientProvider client={queryClient}>
      <TicketsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigator />
        </GestureHandlerRootView>
      </TicketsProvider>
    </QueryClientProvider>
  );
}