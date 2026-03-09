import React from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20 px-6">
      {icon}
      <Text className="text-text text-base font-semibold mt-4 text-center">{title}</Text>
      {description ? (
        <Text className="text-text-muted mt-2 text-center">{description}</Text>
      ) : null}
    </View>
  );
}
