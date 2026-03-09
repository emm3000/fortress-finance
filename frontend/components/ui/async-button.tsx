import React from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";

type AsyncButtonProps = PressableProps & {
  label: string;
  isLoading?: boolean;
  loadingIndicatorColor?: string;
  className?: string;
  labelClassName?: string;
};

export function AsyncButton({
  label,
  isLoading = false,
  loadingIndicatorColor = "#0F0F0F",
  className,
  labelClassName,
  disabled,
  ...props
}: AsyncButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <Pressable
      disabled={isDisabled}
      className={`h-14 rounded-xl items-center justify-center active:opacity-80 ${
        isDisabled ? "opacity-60" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={loadingIndicatorColor} />
      ) : (
        <Text className={`text-background font-bold text-lg ${labelClassName ?? ""}`}>{label}</Text>
      )}
    </Pressable>
  );
}
