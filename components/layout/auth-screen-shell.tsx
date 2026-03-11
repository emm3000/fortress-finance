import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type AuthScreenShellProps = {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthScreenShell({ icon, title, subtitle, children }: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 16, 24) }}
          className="px-6"
        >
          <View className="flex-1 justify-center py-12">
            <View className="items-center mb-10">
              <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center border-2 border-primary">
                {icon}
              </View>
              <Text className="text-text text-3xl font-bold mt-4 text-center">{title}</Text>
              <Text className="text-text-muted text-center mt-2">{subtitle}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
