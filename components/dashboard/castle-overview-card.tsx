import { Coins, Flame, Shield } from "lucide-react-native";
import { MotiView } from "moti";
import { Text, View } from "react-native";

import { theme } from "@/constants/theme";

type CastleOverviewCardProps = {
  goldBalance: number;
  hpCurrent: number;
  hpMax: number;
  hpPercentage: number;
  status?: "HEALTHY" | "UNDER_ATTACK" | "RUINS";
  streakDays: number;
};

const STATUS_COLORS: Record<NonNullable<CastleOverviewCardProps["status"]>, string> = {
  HEALTHY: "text-green-400",
  UNDER_ATTACK: "text-red-400",
  RUINS: "text-text-muted",
};

export function CastleOverviewCard({
  goldBalance,
  hpCurrent,
  hpMax,
  hpPercentage,
  status = "HEALTHY",
  streakDays,
}: CastleOverviewCardProps) {
  return (
    <>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 500 }}
        className="mx-6 mt-4 p-6 bg-surface rounded-3xl border border-border"
      >
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-primary/20 rounded-2xl items-center justify-center border border-primary/30">
              <Shield size={28} color={theme.colors.primary.DEFAULT} />
            </View>
            <View className="ml-4">
              <Text className="text-text text-lg font-bold">Tu Fortaleza</Text>
              <Text className={`font-medium ${STATUS_COLORS[status]}`}>
                {status === "HEALTHY" ? "Reino Próspero" : "¡Bajo Ataque!"}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-text text-xl font-bold">
              {hpCurrent} / {hpMax}
            </Text>
            <Text className="text-text-muted text-xs text-right">HP Restante</Text>
          </View>
        </View>

        <View className="h-4 bg-background rounded-full overflow-hidden border border-border">
          <MotiView
            from={{ scaleX: 0 }}
            animate={{ scaleX: hpPercentage / 100 }}
            transition={{ type: "spring", damping: 15 }}
            style={{ width: "100%", transformOrigin: "left" }}
            className={`h-full rounded-full ${hpPercentage < 30 ? "bg-red-500" : "bg-primary"}`}
          />
        </View>
      </MotiView>

      <View className="flex-row px-6 mt-4 space-x-4">
        <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
          <Coins size={24} color={theme.colors.primary.DEFAULT} />
          <Text className="text-text-muted text-xs mt-2">Oro Total</Text>
          <Text className="text-text text-xl font-bold">{goldBalance}</Text>
        </View>
        <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
          <Flame size={24} color="#FF4500" />
          <Text className="text-text-muted text-xs mt-2">Racha Actual</Text>
          <Text className="text-text text-xl font-bold">{streakDays} Días</Text>
        </View>
      </View>
    </>
  );
}
