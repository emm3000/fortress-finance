import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../store/auth.store";

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
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
