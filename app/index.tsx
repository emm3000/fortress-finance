import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/auth.store";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const resolveEntryPoint = async () => {
      if (isLoading) {
        return;
      }

      if (isAuthenticated) {
        router.replace("/(main)");
        return;
      }

      const onboardingSkipped = await SecureStore.getItemAsync("onboarding_skipped");
      if (onboardingSkipped === "true") {
        router.replace("/(auth)/login");
        return;
      }

      router.replace("/(auth)/onboarding");
    };

    void resolveEntryPoint();
  }, [isAuthenticated, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );
}
