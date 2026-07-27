import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setBaseUrl } from '@workspace/api-client-react';
import { installNetLog } from '@/lib/netlog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnswersProvider } from '@/context/AnswersContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Failsafe: if the build was made without EXPO_PUBLIC_DOMAIN, fall back to
// the production domain instead of calling "https://undefined".
const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || 'attached-assets-y1phu.replit.app';
setBaseUrl(`https://${API_DOMAIN}`);
// Log every network request (URL, status, body, network errors) + JS errors
// so failures are visible on-screen in TestFlight builds.
installNetLog(API_DOMAIN);

// Prevent the splash screen from auto-hiding before asset loading is complete.
// preventAutoHideAsync can reject in rare cases — never let that crash startup.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="level/[level]" />
      <Stack.Screen name="quiz/[level]" />
      <Stack.Screen name="results/[level]" />
      <Stack.Screen name="info" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Failsafe: if font loading hangs for any reason, show the app anyway after
  // a short timeout instead of leaving the user stuck on the splash screen.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (!ready) return;
    // Retry hiding the splash a few times — a single failed attempt would
    // otherwise leave the native splash visible forever.
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tryHide = () => {
      SplashScreen.hideAsync().catch(() => {
        attempts += 1;
        if (attempts < 5) timer = setTimeout(tryHide, 500);
      });
    };
    tryHide();
    return () => { if (timer) clearTimeout(timer); };
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AnswersProvider>
                <RootLayoutNav />
              </AnswersProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
