import { Link } from "expo-router";
import { Bell, RefreshCw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type DashboardHeaderProps = {
  isSyncing: boolean;
  onRefresh: () => void;
  userName?: string;
};

export function DashboardHeader({
  isSyncing,
  onRefresh,
  userName,
}: DashboardHeaderProps) {
  return (
    <View className="px-6 py-4 flex-row justify-between items-center">
      <View>
        <Text className="text-text-muted text-sm">Bienvenido, Guerrero</Text>
        <Text className="text-text text-2xl font-bold">{userName}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Link href="/(main)/alerts" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir centro de alertas"
            accessibilityHint="Muestra las alertas de presupuestos y recompensas"
            className="bg-surface p-3 rounded-full border border-border"
          >
            <Bell size={20} color={theme.colors.primary.DEFAULT} />
          </Pressable>
        </Link>
        <Pressable
          onPress={onRefresh}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel="Sincronizar datos"
          accessibilityHint="Actualiza los datos locales con el servidor"
          className="bg-surface p-3 rounded-full border border-border"
        >
          <RefreshCw
            size={20}
            color={theme.colors.primary.DEFAULT}
            className={isSyncing ? "animate-spin" : ""}
          />
        </Pressable>
      </View>
    </View>
  );
}
