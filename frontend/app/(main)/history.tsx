import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useTransactions } from "../../hooks/useTransactions";
import { useSync } from "../../hooks/useSync";
import { CategoryRepository, Category } from "../../db/category.repository";
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

export default function HistoryScreen() {
  const { transactions, isLoading, refreshTransactions } = useTransactions();
  const { performSync, isSyncing } = useSync();
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});

  useEffect(() => {
    async function loadCategories() {
      const data = await CategoryRepository.getAll();
      const catMap = data.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});
      setCategories(catMap);
    }
    loadCategories();
  }, []);

  const onRefresh = async () => {
    await performSync();
    await refreshTransactions();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-2">Crónicas de Guerra</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFD700" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
            />
          }
        >
          <View className="p-6">
            {transactions.length === 0 ? (
              <View className="items-center justify-center py-20">
                <History size={64} color="#444" />
                <Text className="text-gray-500 mt-4 text-center">
                  Aún no hay batallas registradas en el pergamino.
                </Text>
              </View>
            ) : (
              transactions.map((t) => {
                const category = categories[t.category_id || ""];
                return (
                  <View
                    key={t.id}
                    className="mb-4 p-4 bg-surface rounded-2xl border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          t.type === "EXPENSE" ? "bg-red-500/10" : "bg-green-500/10"
                        }`}
                      >
                        {t.type === "EXPENSE" ? (
                          <TrendingDown size={24} color="#f87171" />
                        ) : (
                          <TrendingUp size={24} color="#4ade80" />
                        )}
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                          {t.description || category?.name || "Sin descripción"}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {format(new Date(t.date), "PPP", { locale: es })}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-end ml-4">
                      <Text
                        className={`font-bold text-lg ${
                          t.type === "EXPENSE" ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {t.type === "EXPENSE" ? "-" : "+"}
                        {t.amount}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        {t.is_synced ? (
                          <CloudCheck size={12} color="#4ade80" />
                        ) : (
                          <CloudOff size={12} color="#666" />
                        )}
                        <Text className="text-[10px] text-gray-600 ml-1">
                          {t.is_synced ? "Sincronizado" : "Local"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
