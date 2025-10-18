// App.tsx 
import "react-native-gesture-handler"; 
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "react-native-splash-screen";
import { useNetworkMonitor } from "./src/hooks/useNetworkMonitor";
import { Provider as PaperProvider } from "react-native-paper";
import { NetworkSnackbar } from "./src/components/snackbars/NetworkSnackbar";

const queryClient = new QueryClient();

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
