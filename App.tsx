import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from 'react-native-splash-screen';
import { useNetworkMonitor } from './src/hooks/useNetworkMonitor';
import { Provider as PaperProvider } from 'react-native-paper';
import { NetworkSnackbar } from './src/components/ui/SnackBars/NetworkSnackbar';
import { useAuth } from './src/stores/auth-store';
import { useEventCacheHydration } from './src/hooks/useEventCacheHydration';
import { useUserDataSync } from './src/hooks/useUserDataSync';

const queryClient = new QueryClient();

function AppContent() {
  useNetworkMonitor();
  
  // Hydrate Event Cache
  const { isHydrated: isEventHydrated } = useEventCacheHydration();

  // Synchronize User Data (Side Effect)
  // Pass isEventHydrated so it waits for the database to be ready
  useUserDataSync(isEventHydrated);

  // Auth Init
  useEffect(() => {
    const unsubscribe = useAuth.getState().initialize();
    return () => unsubscribe();
  }, []);

  // Splash Screen Handling
  useEffect(() => {
    if (isEventHydrated) {
      SplashScreen.hide();
    }
  }, [isEventHydrated]);

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
      <NetworkSnackbar />
    </>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </PaperProvider>
  );
}