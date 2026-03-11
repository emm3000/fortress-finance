import React, { useEffect, useCallback, useRef } from "react";
import { Link } from "expo-router";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CastleOverviewCard } from "@/components/dashboard/castle-overview-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { useAuthStore } from "@/store/auth.store";
import { useCastle } from "@/hooks/useCastle";
import { useSync } from "@/hooks/useSync";
import { useSyncQueueStatus } from "@/hooks/useSyncQueueStatus";
import { useTransactions } from "@/hooks/useTransactions";
import { useMonthlyDashboard } from "@/hooks/useMonthlyDashboard";
import { theme } from "@/constants/theme";
import { TrendingDown } from "lucide-react-native";
import { runWhenIdle } from "@/utils/idle";

const isCastleStatus = (
  value: string | undefined
): value is "HEALTHY" | "UNDER_ATTACK" | "RUINS" =>
  value === "HEALTHY" || value === "UNDER_ATTACK" || value === "RUINS";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { castle } = useCastle();
  const { performSync, isSyncing } = useSync();
  const { data: syncQueueStatus } = useSyncQueueStatus();
  const { transactions } = useTransactions();
  const { data: monthlyDashboard } = useMonthlyDashboard();
  const hasInitializedSync = useRef(false);
  const insets = useSafeAreaInsets();
  const hpCurrent = castle?.hp ?? 0;
  const hpMax = castle?.max_hp ?? 0;

  useEffect(() => {
    if (hasInitializedSync.current) return;
    hasInitializedSync.current = true;

    const task = runWhenIdle(() => {
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
        {(syncQueueStatus?.pendingCount ?? 0) > 0 || (syncQueueStatus?.failedCount ?? 0) > 0 ? (
          <View className="mx-6 mt-3 p-3 rounded-xl border border-border bg-surface">
            <Text className="text-text text-xs">
              {`Sync pendiente: ${String(syncQueueStatus?.pendingCount ?? 0)} · Fallidos: ${String(syncQueueStatus?.failedCount ?? 0)}`}
            </Text>
            {syncQueueStatus?.failedCount ? (
              <Text className="text-red-400 text-[11px] mt-1">
                {syncQueueStatus.lastError || "Hay operaciones en reintento automático."}
              </Text>
            ) : null}
          </View>
        ) : null}

        <DashboardHeader isSyncing={isSyncing} onRefresh={onRefresh} userName={user?.name} />

        <CastleOverviewCard
          goldBalance={castle?.gold_balance ?? 0}
          hpCurrent={hpCurrent}
          hpMax={hpMax}
          hpPercentage={hpPercentage}
          status={isCastleStatus(castle?.status) ? castle.status : undefined}
          streakDays={castle?.streak_days ?? 0}
        />

        <MonthlySummary maxCategorySpent={maxCategorySpent} monthlyDashboard={monthlyDashboard} />

        <RecentTransactions onLogout={logout} recentTransactions={recentTransactions} />
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
