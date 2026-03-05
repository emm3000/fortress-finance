import { Stack } from "expo-router";
import "../global.css";

import { useEffect } from 'react';
import { initDatabase } from '../db/database';

export default function RootLayout() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
