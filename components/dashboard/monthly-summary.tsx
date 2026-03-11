import { Link } from "expo-router";
import { BarChart3, Coins, PiggyBank, Wallet } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import type { MonthlyDashboardResponse } from "@/services/dashboard.service";

type MonthlySummaryProps = {
  maxCategorySpent: number;
  monthlyDashboard?: MonthlyDashboardResponse;
};

export function MonthlySummary({
  maxCategorySpent,
  monthlyDashboard,
}: MonthlySummaryProps) {
  return (
    <View className="px-6 mt-8">
      <View className="flex-row items-center mb-4">
        <BarChart3 size={18} color={theme.colors.primary.DEFAULT} />
        <Text className="text-text text-lg font-bold ml-2">Resumen del Mes</Text>
        <Link href="/(main)/budgets" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a presupuestos"
            accessibilityHint="Abre la pantalla para crear y editar presupuestos"
            className="ml-auto px-3 py-2 rounded-lg border border-border"
          >
            <Text className="text-primary text-xs font-semibold">Presupuestos</Text>
          </Pressable>
        </Link>
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
  );
}
