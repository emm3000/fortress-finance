import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useCastle } from "../../hooks/useCastle";
import { useSync } from "../../hooks/useSync";
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

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { castle, refreshCastle } = useCastle();
  const { performSync, isSyncing } = useSync();

  useEffect(() => {
    // Initial sync on mount
    performSync().then(() => refreshCastle());
  }, [performSync, refreshCastle]);

  const onRefresh = async () => {
    await performSync();
    await refreshCastle();
  };

  const hpPercentage = castle ? (castle.hp / castle.max_hp) * 100 : 0;
  const statusColors: any = {
    HEALTHY: "text-green-400",
    UNDER_ATTACK: "text-red-400",
    RUINS: "text-gray-500",
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
          />
        }
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400 text-sm">Bienvenido, Guerrero</Text>
            <Text className="text-white text-2xl font-bold">{user?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={performSync}
            disabled={isSyncing}
            className="bg-surface p-3 rounded-full border border-border"
          >
            <RefreshCw
              size={20}
              color="#FFD700"
              className={isSyncing ? "animate-spin" : ""}
            />
          </TouchableOpacity>
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
                <Shield size={28} color="#FFD700" />
              </View>
              <View className="ml-4">
                <Text className="text-white text-lg font-bold">Tu Fortaleza</Text>
                <Text className={`font-medium ${statusColors[castle?.status || "HEALTHY"]}`}>
                  {castle?.status === "HEALTHY" ? "Reino Próspero" : "¡Bajo Ataque!"}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-white text-xl font-bold">{castle?.hp} / {castle?.max_hp}</Text>
              <Text className="text-gray-500 text-xs text-right">HP Restante</Text>
            </View>
          </View>

          {/* HP Bar */}
          <View className="h-4 bg-background rounded-full overflow-hidden border border-border">
            <MotiView
              from={{ width: "0%" }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: "spring", damping: 15 }}
              className={`h-full rounded-full ${hpPercentage < 30 ? "bg-red-500" : "bg-primary"}`}
            />
          </View>
        </MotiView>

        {/* Stats Row */}
        <View className="flex-row px-6 mt-4 space-x-4">
          <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
            <Coins size={24} color="#FFD700" />
            <Text className="text-gray-400 text-xs mt-2">Oro Total</Text>
            <Text className="text-white text-xl font-bold">{castle?.gold_balance || 0}</Text>
          </View>
          <View className="flex-1 p-4 bg-surface rounded-3xl border border-border">
            <Flame size={24} color="#FF4500" />
            <Text className="text-gray-400 text-xs mt-2">Racha Actual</Text>
            <Text className="text-white text-xl font-bold">{castle?.streak_days || 0} Días</Text>
          </View>
        </View>

        {/* Recent Activity Placeholder */}
        <View className="px-6 mt-8">
          <Text className="text-white text-lg font-bold mb-4">Registro de Batallas</Text>
          {[1, 2].map((i) => (
            <View key={i} className="mb-3 p-4 bg-surface rounded-2xl border border-border flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${i === 1 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  {i === 1 ? <TrendingDown size={20} color="#f87171" /> : <TrendingUp size={20} color="#4ade80" />}
                </View>
                <View className="ml-4">
                  <Text className="text-white font-medium">{i === 1 ? "Ataque de Orcos (Exceso)" : "Día de Paz (Ahorro)"}</Text>
                  <Text className="text-gray-500 text-xs">Ayer, 08:00 PM</Text>
                </View>
              </View>
              <Text className={`font-bold ${i === 1 ? 'text-red-400' : 'text-green-400'}`}>
                {i === 1 ? "-12 HP" : "+2 HP"}
              </Text>
            </View>
          ))}
          
          <TouchableOpacity className="mt-2 py-4 flex-row items-center justify-center">
            <Text className="text-primary font-medium">Ver todas las crónicas</Text>
            <ChevronRight size={16} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Logout (Provisional) */}
        <TouchableOpacity 
          onPress={logout}
          className="mx-6 mt-8 flex-row items-center justify-center p-4 border border-red-900/30 rounded-2xl"
        >
          <LogOut size={18} color="#991b1b" />
          <Text className="ml-2 text-red-800 font-medium text-sm">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
