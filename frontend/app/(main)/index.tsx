import React, { useEffect, useCallback, useRef } from "react";
import { Link } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  InteractionManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import { useCastle } from "../../hooks/useCastle";
import { useSync } from "../../hooks/useSync";
import { useTransactions } from "../../hooks/useTransactions";
import { useMonthlyDashboard } from "../../hooks/useMonthlyDashboard";
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
  Wallet,
  PiggyBank,
  BarChart3,
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
  const { castle } = useCastle();
  const { performSync, isSyncing } = useSync();
  const { transactions } = useTransactions();
  const { data: monthlyDashboard } = useMonthlyDashboard();
  const hasInitializedSync = useRef(false);
  const insets = useSafeAreaInsets();
  const hpCurrent = castle?.hp ?? 0;
  const hpMax = castle?.max_hp ?? 0;

  useEffect(() => {
    if (hasInitializedSync.current) return;
    hasInitializedSync.current = true;

    const task = InteractionManager.runAfterInteractions(() => {
      performSync().catch((error) => console.error("Initial Sync Failed:", error));
    });

    return () => task.cancel();
  }, [performSync]);

  const onRefresh = useCallback(async () => {
    try {
      await performSync();
    } catch (error) {
       console.error("Refresh failed:", error);
    }
  }, [performSync]);

  const hpPercentage = React.useMemo(() => {
    if (!hpMax) return 0;
    return (hpCurrent / hpMax) * 100;
  }, [hpCurrent, hpMax]);

  const recentTransactions = React.useMemo(() => {
    return transactions.slice(0, 3);
  }, [transactions]);
  const maxCategorySpent = React.useMemo(() => {
    const categories = monthlyDashboard?.topExpenseCategories ?? [];
    return Math.max(...categories.map((item) => item.totalSpent), 0);
  }, [monthlyDashboard?.topExpenseCategories]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 88, 100) }}
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
              <Text className="text-text text-xl font-bold">{hpCurrent} / {hpMax}</Text>
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

        {/* Monthly Summary */}
        <View className="px-6 mt-8">
          <View className="flex-row items-center mb-4">
            <BarChart3 size={18} color={theme.colors.primary.DEFAULT} />
            <Text className="text-text text-lg font-bold ml-2">Resumen del Mes</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 p-4 bg-surface rounded-2xl border border-border">
              <View className="flex-row items-center">
                <Wallet size={16} color="#4ade80" />
                <Text className="text-text-muted text-xs ml-2">Ingresos</Text>
              </View>
              <Text className="text-green-400 text-xl font-bold mt-2">
                +{monthlyDashboard?.totals.income ?? 0}
              </Text>
            </View>

            <View className="flex-1 p-4 bg-surface rounded-2xl border border-border">
              <View className="flex-row items-center">
                <Coins size={16} color="#f87171" />
                <Text className="text-text-muted text-xs ml-2">Gastos</Text>
              </View>
              <Text className="text-red-400 text-xl font-bold mt-2">
                -{monthlyDashboard?.totals.expense ?? 0}
              </Text>
            </View>

            <View className="flex-1 p-4 bg-surface rounded-2xl border border-border">
              <View className="flex-row items-center">
                <PiggyBank size={16} color={theme.colors.primary.DEFAULT} />
                <Text className="text-text-muted text-xs ml-2">Balance</Text>
              </View>
              <Text className="text-text text-xl font-bold mt-2">
                {monthlyDashboard?.totals.balance ?? 0}
              </Text>
            </View>
          </View>

          <View className="mt-4 p-4 bg-surface rounded-2xl border border-border">
            <Text className="text-text font-semibold mb-3">Top categorías de gasto</Text>
            {(monthlyDashboard?.topExpenseCategories.length ?? 0) === 0 ? (
              <Text className="text-text-muted text-sm">
                Aún no hay gastos este mes. Registra tu primera transacción.
              </Text>
            ) : (
              monthlyDashboard?.topExpenseCategories.map((item) => {
                const widthPercent =
                  maxCategorySpent > 0 ? (item.totalSpent / maxCategorySpent) * 100 : 0;
                return (
                  <View key={item.categoryId} className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-text text-sm" numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                      <Text className="text-text-muted text-xs">{item.totalSpent}</Text>
                    </View>
                    <View className="h-2 rounded-full bg-background border border-border overflow-hidden">
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(widthPercent, 4)}%` }}
                      />
                    </View>
                  </View>
                );
              })
            )}
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
          
          <Link href="/(main)/history" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver historial completo"
              accessibilityHint="Abre la pantalla con todas las transacciones"
              className="mt-2 py-4 flex-row items-center justify-center"
            >
              <Text className="text-primary font-medium">Ver todas las crónicas</Text>
              <ChevronRight size={16} color={theme.colors.primary.DEFAULT} />
            </Pressable>
          </Link>
        </View>

        {/* Logout */}
        <Pressable 
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          accessibilityHint="Finaliza tu sesión actual y vuelve al login"
          className="mx-6 mt-8 flex-row items-center justify-center p-4 border border-red-900/30 rounded-2xl"
        >
          <LogOut size={18} color={theme.colors.dangerDark} />
          <Text className="ml-2 text-red-400 font-medium text-sm">Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>

      <Link href="/(main)/new-transaction" asChild>
        <Pressable
          style={{ bottom: insets.bottom + 16 }}
          accessibilityRole="button"
          accessibilityLabel="Registrar transacción"
          accessibilityHint="Abre el formulario para crear una nueva transacción"
          className="absolute right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/50 border-4 border-background"
        >
          <TrendingDown size={32} color={theme.colors.background} />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}
