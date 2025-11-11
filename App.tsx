import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "react-native-splash-screen";
import { useNetworkMonitor } from "./src/hooks/useNetworkMonitor";
import { Provider as PaperProvider } from "react-native-paper";
import { NetworkSnackbar } from "./src/components/ui/SnackBars/NetworkSnackbar";
import { supabase } from "./src/lib/supabase";

const queryClient = new QueryClient();

// --- APP STATE HANDLING ---
// Listen for app state changes to proactively handle token refresh
// and network connection state.
AppState.addEventListener("change", (nextAppState) => {
  if (nextAppState === "active") {

    console.log("[AppState] App is active. Proactively refreshing session...");

    // Proactively "wake up" the auth client.
    // This checks if the token needs refreshing and restarts the timer.
    supabase.auth.getSession();

  } else {
    // App has gone to the background.
    console.log("[AppState] App is inactive. Pausing auth auto-refresh.");

    // Pause the auth refresh timer to save battery.
    supabase.auth.stopAutoRefresh();
  }
});

export default function App() {
  useNetworkMonitor();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </GestureHandlerRootView>
      </QueryClientProvider>
      <NetworkSnackbar />
    </PaperProvider>
  );
}