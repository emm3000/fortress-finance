import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-4xl font-bold text-primary">
        ¡Hola Mundo! 🏰
      </Text>
      <Text className="text-gray-400 mt-4 text-lg">
        Defensa de la Fortaleza
      </Text>
      <View className="mt-8 p-4 bg-surface rounded-2xl border border-border">
        <Text className="text-white">Motor de Sincronización Ready ⚡️</Text>
      </View>
    </View>
  );
}
