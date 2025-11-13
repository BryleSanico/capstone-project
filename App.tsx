import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
import { supabase } from './src/lib/supabase';
import { useAuth } from './src/stores/auth-store';

const queryClient = new QueryClient();

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    console.log('[AppState] App is active...');
    supabase.auth.getSession();
    focusManager.setFocused(true);
  } else {
    console.log('[AppState] App is inactive...');
    supabase.auth.stopAutoRefresh();
    focusManager.setFocused(false);
  }
});

function AppContent() {
  useNetworkMonitor();
  const queryClientHook = useQueryClient();
  const { user, isInitialized } = useAuth();
  
  // Prevent clearing the cache on the *initial* app load.
  // Clear/invalidate on *actual* login/logout, modifying events only.
  const hasInitializedRef = useRef(false);

  // Auth Initialization Effect
  useEffect(() => {
    // This runs once and sets up the listener
    const unsubscribe = useAuth.getState().initialize();
    return () => {
      unsubscribe();
    };
  }, []);

  // Auth State Change Effect
  useEffect(() => {
    // Wait for the auth store to be initialized
    if (!isInitialized) {
      return;
    }

    // Check the ref
    if (!hasInitializedRef.current) {
      // This is the first time `isInitialized` is true and mark it as initialized
      hasInitializedRef.current = true;
      return;
    }

    // This code now only runs on *subsequent* auth changes
    if (!user) {
      // User has logged out
      console.log(
        '[AppContent] User has logged out. Clearing React Query cache...',
      );
      queryClientHook.clear();
    } else {
      // User has logged in
      console.log(
        '[AppContent] User has logged in. Invalidating queries...',
      );
      queryClientHook.invalidateQueries();
    }
  }, [user, isInitialized, queryClientHook]); 

  useEffect(() => {
    SplashScreen.hide();
  }, []);

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