import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type LabeledInputProps = TextInputProps & {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  inputWrapperClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
};

export function LabeledInput({
  label,
  error,
  icon,
  containerClassName,
  inputWrapperClassName,
  labelClassName,
  errorClassName,
  className,
  ...inputProps
}: LabeledInputProps) {
  return (
    <View className={containerClassName}>
      <Text className={`text-gray-300 mb-2 ml-1 ${labelClassName ?? ""}`}>{label}</Text>
      <View
        className={`flex-row items-center bg-surface border border-border rounded-xl px-4 h-14 ${
          inputWrapperClassName ?? ""
        }`}
      >
        {icon}
        <TextInput
          className={`flex-1 text-text ml-3 ${className ?? ""}`}
          placeholderTextColor="#666"
          {...inputProps}
        />
      </View>
      {error ? <Text className={`text-red-400 text-sm mt-1 ml-1 ${errorClassName ?? ""}`}>{error}</Text> : null}
    </View>
  );
}
