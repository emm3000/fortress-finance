import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
  color?: string;
};

export function LoadingState({
  message = "Cargando...",
  color = "#FFD700",
}: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <ActivityIndicator color={color} />
      <Text className="text-text-muted mt-3 text-center">{message}</Text>
    </View>
  );
}
