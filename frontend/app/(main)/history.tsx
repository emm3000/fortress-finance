import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTransactions } from "../../hooks/useTransactions";
import { useSync } from "../../hooks/useSync";
import { Transaction } from "../../db/transaction.repository";
import { CategoryRepository, Category } from "../../db/category.repository";
import { EmptyState } from "../../components/feedback/empty-state";
import { LoadingState } from "../../components/feedback/loading-state";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  History,
  CloudOff,
  CloudCheck,
} from "lucide-react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TransactionListItem = React.memo(function TransactionListItem({
  transaction,
  category,
}: {
  transaction: Transaction;
  category?: Category;
}) {
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
          <Text className="text-text-muted text-xs">
            {format(new Date(transaction.date), "PPP", { locale: es })}
          </Text>
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
      </View>
    </View>
  );
});

export default function HistoryScreen() {
  const { 
    transactions, 
    isLoading: isTransactionsLoading, 
    isFetchingNextPage,
    refreshTransactions,
    fetchNextPage
  } = useTransactions();
  const { performSync, isSyncing } = useSync();
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});

  useEffect(() => {
    async function loadCategories() {
      const data = await CategoryRepository.getAll();
      const catMap: { [key: string]: Category } = {};
      for (const cat of data) {
        catMap[cat.id] = cat;
      }
      setCategories(catMap);
    }
    loadCategories();
  }, []);

  const onRefresh = async () => {
    try {
      await performSync();
    } finally {
      await refreshTransactions();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          accessibilityHint="Regresa al dashboard"
          className="p-2 -ml-2"
        >
          <ArrowLeft size={24} color="#FFD700" />
        </Pressable>
        <Text className="text-text text-xl font-bold ml-2">Crónicas de Guerra</Text>
      </View>

      {isTransactionsLoading && transactions.length === 0 ? (
        <LoadingState message="Cargando crónicas..." />
      ) : (
        <View className="flex-1 px-6">
          <FlashList
            data={transactions}
            keyExtractor={(item: Transaction) => item.id}
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
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
            renderItem={({ item: t }: { item: Transaction }) => {
              const category = categories[t.category_id || ""];
              return <TransactionListItem transaction={t} category={category} />;
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
