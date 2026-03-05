import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { initDatabase } from '../db/database';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Layout: Database initialization failed", error);
      } finally {
        setDbInitialized(true);
        await SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);

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
