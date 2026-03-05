import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { initDatabase } from '../db/database';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error("Layout: Database initialization failed", error);
        setDbError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
