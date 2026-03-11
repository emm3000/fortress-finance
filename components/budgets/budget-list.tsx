import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Pencil,
  ShieldAlert,
} from "lucide-react-native";

import { EmptyState } from "@/components/feedback/empty-state";
import type { Budget } from "@/services/budget.service";

type Status = "NORMAL" | "RISK" | "EXCEEDED";

const getStatus = (spent: number, limit: number): Status => {
  if (limit <= 0) return "NORMAL";
  const ratio = spent / limit;
  if (ratio >= 1) return "EXCEEDED";
  if (ratio >= 0.8) return "RISK";
  return "NORMAL";
};

const STATUS_UI: Record<
  Status,
  { label: string; colorClass: string; barClass: string; icon: React.ReactNode }
> = {
  NORMAL: {
    label: "Normal",
    colorClass: "text-green-400",
    barClass: "bg-green-500",
    icon: <CheckCircle2 size={14} color="#4ade80" />,
  },
  RISK: {
    label: "Riesgo",
    colorClass: "text-yellow-400",
    barClass: "bg-yellow-500",
    icon: <AlertTriangle size={14} color="#facc15" />,
  },
  EXCEEDED: {
    label: "Excedido",
    colorClass: "text-red-400",
    barClass: "bg-red-500",
    icon: <ShieldAlert size={14} color="#f87171" />,
  },
};

type BudgetListProps = {
  budgets: Budget[];
  isLoading: boolean;
  onEdit: (budget: Budget) => void;
  progressByCategory: Record<string, number>;
};

export function BudgetList({
  budgets,
  isLoading,
  onEdit,
  progressByCategory,
}: BudgetListProps) {
  return (
    <View className="mt-6">
      <Text className="text-text font-semibold text-base mb-3">Tus presupuestos activos</Text>

      {isLoading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#FFD700" />
        </View>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<Coins size={52} color="#444" />}
          title="Sin presupuestos aún"
          description="Crea tu primer límite mensual para controlar mejor tus gastos."
        />
      ) : (
        budgets.map((budget) => {
          const spent = progressByCategory[budget.categoryId] ?? 0;
          const percent = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
          const safePercent = Math.max(0, Math.min(100, percent));
          const status = getStatus(spent, budget.limitAmount);
          const statusUi = STATUS_UI[status];

          return (
            <View key={budget.id} className="mb-3 p-4 bg-surface rounded-2xl border border-border">
              <View className="flex-row justify-between items-center">
                <Text className="text-text font-semibold text-base">{budget.category.name}</Text>
                <View className="flex-row items-center">
                  {statusUi.icon}
                  <Text className={`ml-1 text-xs font-semibold ${statusUi.colorClass}`}>
                    {statusUi.label}
                  </Text>
                </View>
              </View>

              <Text className="text-text-muted text-xs mt-2">
                Gastado {spent.toFixed(2)} / Límite {budget.limitAmount.toFixed(2)}
              </Text>

              <View className="mt-2 h-2 rounded-full bg-background border border-border overflow-hidden">
                <View className={`h-full ${statusUi.barClass}`} style={{ width: `${safePercent}%` }} />
              </View>

              <Pressable
                onPress={() => onEdit(budget)}
                className="mt-3 self-start px-3 py-2 rounded-lg border border-border flex-row items-center"
              >
                <Pencil size={14} color="#9ca3af" />
                <Text className="ml-2 text-text-muted text-xs">Editar límite</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}
