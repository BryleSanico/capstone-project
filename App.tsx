// App.tsx 
import "react-native-gesture-handler"; 
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "react-native-splash-screen";
import { useTickets } from '@/src/hooks/tickets-store';

const queryClient = new QueryClient();

export default function App() {

  const { loadTickets, loadFavorites } = useTickets();
    // Mount tickets and favorites
    useEffect (() => {
      loadTickets();
      loadFavorites();
    }, [loadTickets, loadFavorites]);

  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
