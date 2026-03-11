import React from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

type ScreenHeaderProps = {
  title?: string;
  titleSlot?: React.ReactNode;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  backAccessibilityHint?: string;
  backIconColor?: string;
  bordered?: boolean;
  size?: "sm" | "lg";
  withHorizontalPadding?: boolean;
  className?: string;
  rightSlot?: React.ReactNode;
};

export function ScreenHeader({
  title,
  titleSlot,
  onBack,
  backAccessibilityLabel = "Volver",
  backAccessibilityHint,
  backIconColor = "#FFD700",
  bordered = true,
  size = "sm",
  withHorizontalPadding = true,
  className,
  rightSlot,
}: ScreenHeaderProps) {
  const paddingClassName = size === "lg" ? "py-6" : "py-4";
  const hasTitle = typeof title === "string" && title.length > 0;

  return (
    <View
      className={`${withHorizontalPadding ? "px-6" : ""} flex-row items-center ${paddingClassName} ${
        bordered ? "border-b border-border" : ""
      } ${className ?? ""}`}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          accessibilityHint={backAccessibilityHint}
          className="p-2 -ml-2"
        >
          <ArrowLeft size={24} color={backIconColor} />
        </Pressable>
      ) : null}
      {hasTitle ? (
        <Text className={`text-text text-xl font-bold ${onBack ? "ml-2" : ""}`}>{title}</Text>
      ) : null}
      {titleSlot ? <View className={onBack ? "ml-2" : ""}>{titleSlot}</View> : null}
      {rightSlot ? <View className="ml-auto">{rightSlot}</View> : null}
    </View>
  );
}
