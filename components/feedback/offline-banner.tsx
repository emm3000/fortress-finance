import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WifiOff } from "lucide-react-native";
import { useNetworkStore } from "@/store/network.store";

export function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const isInitialized = useNetworkStore((state) => state.isInitialized);
  const insets = useSafeAreaInsets();

  if (!isInitialized || isOnline) {
    return null;
  }

  return (
    <View
      className="absolute top-0 left-0 right-0 z-50 bg-amber-500/95 px-4 pb-2"
      style={{ paddingTop: Math.max(insets.top + 8, 12) }}
    >
      <View className="flex-row items-center justify-center">
        <WifiOff size={16} color="#111111" />
        <Text className="ml-2 text-center text-xs font-semibold text-[#111111]">
          Sin internet. Trabajando en modo local, la sincronizacion quedara pendiente.
        </Text>
      </View>
    </View>
  );
}
