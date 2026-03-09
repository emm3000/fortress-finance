import React from "react";
import { Text } from "react-native";

type InlineErrorProps = {
  message: string | null;
  className?: string;
};

export function InlineError({ message, className = "text-center mt-3" }: InlineErrorProps) {
  if (!message) return null;

  return (
    <Text className={`text-red-400 text-sm ${className}`}>
      {message}
    </Text>
  );
}
