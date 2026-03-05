import React, { useEffect, useCallback } from "react";
import { router, Href } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useCastle } from "../../hooks/useCastle";
import { useSync } from "../../hooks/useSync";
import { useTransactions } from "../../hooks/useTransactions";
import { theme } from "../../constants/theme";
import {
  Shield,
  Coins,
  Flame,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { MotiView } from "moti";

const STATUS_COLORS: Record<string, string> = {
  HEALTHY: "text-green-400",
  UNDER_ATTACK: "text-red-400",
  RUINS: "text-text-muted",
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { castle, refreshCastle } = useCastle();
  const { performSync, isSyncing } = useSync();
  const { transactions } = useTransactions();

  console.log("Dashboard Rendered");

  useEffect(() => {
    console.log("Dashboard: Mounting and Running Initial Sync");
    let mounted = true;
    performSync()
      .then(() => {
        if (mounted) refreshCastle();
      })
      .catch((error) => console.error("Initial Sync Failed:", error));
      
    return () => { mounted = false; };
  }, []); // Run once on mount to avoid infinite loops from hook re-renders

  const onRefresh = useCallback(async () => {
    try {
      await performSync();
      await refreshCastle();
    } catch (error) {
       console.error("Refresh failed:", error);
    }
  }, [performSync, refreshCastle]);

  const navigateToHistory = useCallback(() => {
    router.push("/(main)/history" as Href);
  }, []);

  const navigateToNewTransaction = useCallback(() => {
    router.push("/(main)/new-transaction" as Href);
  }, []);

  const hpPercentage = React.useMemo(() => {
    return castle ? (castle.hp / castle.max_hp) * 100 : 0;
  }, [castle]);

  const recentTransactions = React.useMemo(() => {
    return transactions.slice(0, 3);
  }, [transactions]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <View>
            <Text className="text-text-muted text-sm">Bienvenido, Guerrero</Text>
            <Text className="text-text text-2xl font-bold">{user?.name}</Text>
          </View>
          <Pressable
            onPress={performSync}
            disabled={isSyncing}
            className="bg-surface p-3 rounded-full border border-border"
          >
            <RefreshCw
              size={20}
              color={theme.colors.primary.DEFAULT}
              className={isSyncing ? "animate-spin" : ""}
            />
          </Pressable>
        </View>

        {/* Castle Status Card */}
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
                <Text className={`font-medium ${STATUS_COLORS[castle?.status || "HEALTHY"]}`}>
                  {castle?.status === "HEALTHY" ? "Reino Próspero" : "¡Bajo Ataque!"}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-text text-xl font-bold">{castle?.hp} / {castle?.max_hp}</Text>
              <Text className="text-text-muted text-xs text-right">HP Restante</Text>
            </View>
          </View>

          {/* HP Bar */}
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

        {/* Stats Row */}
        <View className="flex-row px-6 mt-4 space-x-4">
          <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
            <Coins size={24} color={theme.colors.primary.DEFAULT} />
            <Text className="text-text-muted text-xs mt-2">Oro Total</Text>
            <Text className="text-text text-xl font-bold">{castle?.gold_balance || 0}</Text>
          </View>
          <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
            <Flame size={24} color="#FF4500" />
            <Text className="text-text-muted text-xs mt-2">Racha Actual</Text>
            <Text className="text-text text-xl font-bold">{castle?.streak_days || 0} Días</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-8">
          <Text className="text-text text-lg font-bold mb-4">Registro de Batallas</Text>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <View key={t.id} className="mb-3 p-4 bg-surface rounded-2xl border border-border flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${t.type === 'EXPENSE' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    {t.type === 'EXPENSE' ? <TrendingDown size={20} color={theme.colors.danger} /> : <TrendingUp size={20} color={theme.colors.success} />}
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-text font-medium" numberOfLines={1}>{t.description || "Transacción"}</Text>
                    <Text className="text-text-muted text-xs">{new Date(t.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text className={`font-bold ml-2 ${t.type === 'EXPENSE' ? 'text-red-400' : 'text-green-400'}`}>
                  {t.type === 'EXPENSE' ? "-" : "+"}{t.amount} G
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-text-muted mt-2 mb-4 text-center">Sin batallas recientes</Text>
          )}
          
          <Pressable 
            onPress={navigateToHistory}
            className="mt-2 py-4 flex-row items-center justify-center"
          >
            <Text className="text-primary font-medium">Ver todas las crónicas</Text>
            <ChevronRight size={16} color={theme.colors.primary.DEFAULT} />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable 
          onPress={logout}
          className="mx-6 mt-8 flex-row items-center justify-center p-4 border border-red-900/30 rounded-2xl"
        >
          <LogOut size={18} color={theme.colors.dangerDark} />
          <Text className="ml-2 text-red-800 font-medium text-sm">Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={navigateToNewTransaction}
        className="absolute bottom-10 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/50 border-4 border-background"
      >
        <TrendingDown size={32} color={theme.colors.background} />
      </Pressable>
    </SafeAreaView>
  );
}
