import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../store/auth.store";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/(main)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );
}
