import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  useQueryClient,
} from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from 'react-native-splash-screen';
import { useNetworkMonitor } from './src/hooks/useNetworkMonitor';
import { Provider as PaperProvider } from 'react-native-paper';
import { NetworkSnackbar } from './src/components/ui/SnackBars/NetworkSnackbar';
import { useAuth } from './src/stores/auth-store';
import { useCacheHydration } from './src/hooks/useCacheHydration';
import * as sqliteService from './src/services/sqliteService';
import { Loader } from './src/components/LazyLoaders/loader';

const queryClient = new QueryClient();

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    console.log('[AppState] App is active...');
    focusManager.setFocused(true);
  } else {
    console.log('[AppState] App is inactive...');
    focusManager.setFocused(false);
  }
});

function AppContent() {
  useNetworkMonitor();
  const queryClientHook = useQueryClient();
  const { user, isInitialized } = useAuth();
  const hasAuthBeenInitialized = useRef(false);
  // This hook seeds the cache from SQLite
  const { isHydrated } = useCacheHydration();

  // Auth Initialization Effect
  useEffect(() => {
    const unsubscribe = useAuth.getState().initialize();
    return () => {
      unsubscribe();
    };
  }, []);

  // Auth State Change Effect
  useEffect(() => {
    if (!isInitialized) return;

    if (!hasAuthBeenInitialized.current) {
      hasAuthBeenInitialized.current = true;
      // On first load, we let the hydrator handle the cache.
      // If we are online, we can trigger a background refetch
      // of the data we just hydrated.
      queryClientHook.invalidateQueries();
      return;
    }

    if (!user) {
      console.log(
        '[AppContent] User has logged out. Clearing React Query and SQLite cache...',
      );
      queryClientHook.clear();
      sqliteService.clearDatabase(); 
    } else {
      console.log(
        '[AppContent] User has logged in. Invalidating queries...',
      );
      queryClientHook.invalidateQueries();
    }
  }, [user, isInitialized, queryClientHook]); 

  useEffect(() => {
    // Hide splash screen only *after* cache is hydrated
    if (isHydrated) {
      SplashScreen.hide();
    }
  }, [isHydrated]);

  // Show a full-screen loader while we read from SQLite
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Loader size={100} />
      </View>
    );
  }

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