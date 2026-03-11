import { Link } from "expo-router";
import { ChevronRight, LogOut, TrendingDown, TrendingUp } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import type { Transaction } from "@/db/transaction.repository";

type RecentTransactionsProps = {
  onLogout: () => Promise<void>;
  recentTransactions: Transaction[];
};

export function RecentTransactions({
  onLogout,
  recentTransactions,
}: RecentTransactionsProps) {
  return (
    <>
      <View className="px-6 mt-8">
        <Text className="text-text text-lg font-bold mb-4">Registro de Batallas</Text>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <View
              key={transaction.id}
              className="mb-3 p-4 bg-surface rounded-2xl border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    transaction.type === "EXPENSE" ? "bg-red-500/10" : "bg-green-500/10"
                  }`}
                >
                  {transaction.type === "EXPENSE" ? (
                    <TrendingDown size={20} color={theme.colors.danger} />
                  ) : (
                    <TrendingUp size={20} color={theme.colors.success} />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-text font-medium" numberOfLines={1}>
                    {transaction.description || "Transacción"}
                  </Text>
                  <Text className="text-text-muted text-xs">
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text
                className={`font-bold ml-2 ${
                  transaction.type === "EXPENSE" ? "text-red-400" : "text-green-400"
                }`}
              >
                {transaction.type === "EXPENSE" ? "-" : "+"}
                {transaction.amount} G
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

      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        accessibilityHint="Finaliza tu sesión actual y vuelve al login"
        className="mx-6 mt-8 flex-row items-center justify-center p-4 border border-red-900/30 rounded-2xl"
      >
        <LogOut size={18} color={theme.colors.dangerDark} />
        <Text className="ml-2 text-red-400 font-medium text-sm">Cerrar Sesión</Text>
      </Pressable>
    </>
  );
}
