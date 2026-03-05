import { View, Text, TouchableOpacity } from "react-native";
import { AuthService } from "../../services/auth.service";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth.store";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-primary text-2xl font-bold mb-2">
        ¡Bienvenido, {user?.name}! 🏰
      </Text>
      <Text className="text-gray-400 text-center mb-10">
        Tu fortaleza está segura por ahora.
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-surface border border-red-500/50 p-4 rounded-xl w-full items-center"
      >
        <Text className="text-red-400 font-bold">Abandonar Fortaleza (Logout)</Text>
      </TouchableOpacity>
    </View>
  );
}
