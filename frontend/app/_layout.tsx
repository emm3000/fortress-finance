import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { initDatabase } from '../db/database';
import { OfflineBanner } from "../components/feedback/offline-banner";
import { GlobalErrorBoundary } from "../components/feedback/global-error-boundary";
import { captureException, initializeMonitoring } from "../services/monitoring.service";
import { useNetworkStore } from "../store/network.store";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
initializeMonitoring();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount) => {
        if (!useNetworkStore.getState().isOnline) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const { colorScheme } = useColorScheme();
  const initializeNetwork = useNetworkStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      let teardownNetwork = () => {};
      try {
        teardownNetwork = await initializeNetwork();
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error("Layout: Database initialization failed", error);
        captureException(error, { phase: "root_layout_prepare" });
        setDbError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await SplashScreen.hideAsync();
      }

      return teardownNetwork;
    }

    const teardownPromise = prepare();
    return () => {
      teardownPromise
        .then((teardown) => teardown?.())
        .catch(() => {});
    };
  }, [initializeNetwork]);

  if (dbError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-red-500 font-bold text-xl mb-4 text-center">
          Error Crítico
        </Text>
        <Text className="text-gray-300 text-center mb-6">
          No se pudo inicializar la base de datos local. La aplicación no puede funcionar.
        </Text>
        <Text className="text-gray-500 text-xs text-center">
          {dbError.message}
        </Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return null;
  }

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <StatusBar style="auto" />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
