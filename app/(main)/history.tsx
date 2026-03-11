import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTransactions } from "@/hooks/useTransactions";
import { useSync } from "@/hooks/useSync";
import { useCategories } from "@/hooks/useCategories";
import { Transaction, TransactionRepository } from "@/db/transaction.repository";
import { Category } from "@/db/category.repository";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  TrendingDown,
  TrendingUp,
  History,
  CloudOff,
  CloudCheck,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuthStore } from "@/store/auth.store";
import { runWhenIdle } from "@/utils/idle";

const TransactionListItem = React.memo(function TransactionListItem({
  transaction,
  category,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  category?: Category;
  onEdit: (transactionId: string) => void;
  onDelete: (transactionId: string) => void;
}) {
  const formattedDate = useMemo(
    () => format(new Date(transaction.date), "PPP", { locale: es }),
    [transaction.date]
  );

  return (
    <View
      className="mb-4 p-4 bg-surface rounded-2xl border border-border flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            transaction.type === "EXPENSE" ? "bg-red-500/10" : "bg-green-500/10"
          }`}
        >
          {transaction.type === "EXPENSE" ? (
            <TrendingDown size={24} color="#f87171" />
          ) : (
            <TrendingUp size={24} color="#4ade80" />
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-text font-bold text-base" numberOfLines={1}>
            {transaction.description || category?.name || "Sin descripción"}
          </Text>
          <Text className="text-text-muted text-xs">{formattedDate}</Text>
        </View>
      </View>

      <View className="items-end ml-4">
        <Text
          className={`font-bold text-lg ${
            transaction.type === "EXPENSE" ? "text-red-400" : "text-green-400"
          }`}
        >
          {transaction.type === "EXPENSE" ? "-" : "+"}
          {transaction.amount}
        </Text>
        <View className="flex-row items-center mt-1">
          {transaction.is_synced ? (
            <CloudCheck size={12} color="#4ade80" />
          ) : (
            <CloudOff size={12} color="#666" />
          )}
          <Text className="text-[10px] text-gray-600 ml-1">
            {transaction.is_synced ? "Sincronizado" : "Local"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          <Pressable
            onPress={() => onEdit(transaction.id)}
            className="w-7 h-7 rounded-lg border border-border items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Editar transacción"
            accessibilityHint="Abre el formulario para editar esta transacción"
          >
            <Pencil size={14} color="#9ca3af" />
          </Pressable>
          <Pressable
            onPress={() => onDelete(transaction.id)}
            className="w-7 h-7 rounded-lg border border-red-900/50 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Eliminar transacción"
            accessibilityHint="Abre una confirmación para eliminar esta transacción"
          >
            <Trash2 size={14} color="#f87171" />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id);
  const { 
    transactions, 
    isLoading: isTransactionsLoading, 
    isFetchingNextPage,
    refreshTransactions,
    fetchNextPage
  } = useTransactions();
  const { performSync, isSyncing } = useSync();
  const { data: categories = [] } = useCategories();

  const categoriesById = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  const onRefresh = useCallback(async () => {
    try {
      await performSync();
    } finally {
      await refreshTransactions();
    }
  }, [performSync, refreshTransactions]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const handleEdit = useCallback((transactionId: string) => {
    router.push({
      pathname: "/(main)/new-transaction",
      params: { id: transactionId },
    });
  }, []);

  const handleDelete = useCallback(
    (transactionId: string) => {
      if (!userId) return;
      Alert.alert(
        "Eliminar transacción",
        "Esta acción ocultará la transacción de tu historial. ¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              TransactionRepository.softDelete(transactionId, userId)
                .then(async () => {
                  await refreshTransactions();
                  runWhenIdle(() => {
                    performSync().catch(() => {
                      // Errors are surfaced through sync state.
                    });
                  });
                })
                .catch((error) => {
                  console.error("Failed to delete transaction locally:", error);
                });
            },
          },
        ]
      );
    },
    [performSync, refreshTransactions, userId]
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const category = categoriesById[item.category_id || ""];
      return (
        <TransactionListItem
          transaction={item}
          category={category}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    },
    [categoriesById, handleDelete, handleEdit]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader
        title="Crónicas de Guerra"
        onBack={() => router.back()}
        backAccessibilityHint="Regresa al dashboard"
      />

      {isTransactionsLoading && transactions.length === 0 ? (
        <LoadingState message="Cargando crónicas..." />
      ) : (
        <View className="flex-1 px-6">
          <FlashList<Transaction>
            data={transactions}
            keyExtractor={keyExtractor}
            // @ts-expect-error - FlashList requires estimatedItemSize but TS type strictness is failing here
            estimatedItemSize={90}
            refreshControl={
              <RefreshControl
                refreshing={isSyncing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
              />
            }
            onEndReached={fetchNextPage}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <EmptyState
                icon={<History size={64} color="#444" />}
                title="Sin batallas registradas"
                description="Aún no hay movimientos en tu pergamino."
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#FFD700" />
                </View>
              ) : null
            }
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom + 24, 40),
            }}
            renderItem={renderItem}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
