import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useSync } from "@/hooks/useSync";
import { useNetworkStore } from "@/store/network.store";
import { NotificationService } from "@/services/notification.service";

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const { performSync } = useSync();
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isOnline || !userId) {
      return;
    }

    NotificationService.ensurePushTokenRegistered(userId).catch((error) => {
      console.error("No se pudo registrar push token:", error);
    });
  }, [isAuthenticated, isLoading, isOnline, userId]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      wasOnlineRef.current = isOnline;
      return;
    }

    const becameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;

    if (!becameOnline) {
      return;
    }

    performSync().catch((error) => {
      console.error("Auto sync on reconnect failed:", error);
    });
  }, [isAuthenticated, isLoading, isOnline, performSync]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="history" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="new-transaction" />
    </Stack>
  );
}
