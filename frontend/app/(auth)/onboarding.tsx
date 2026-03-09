import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Shield, Coins, BellRing } from "lucide-react-native";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const STEPS: OnboardingStep[] = [
  {
    title: "Registra tu reino financiero",
    description: "Guarda ingresos y gastos en segundos para tener claridad total de tu mes.",
    icon: <Shield size={34} color="#FFD700" />,
  },
  {
    title: "Domina presupuestos por categoría",
    description: "Define límites por rubro y vigila cuánto te queda antes de excederte.",
    icon: <Coins size={34} color="#FFD700" />,
  },
  {
    title: "Recibe alertas útiles a tiempo",
    description: "Te avisaremos cuando estés en riesgo para tomar acción antes de cerrar el mes.",
    icon: <BellRing size={34} color="#FFD700" />,
  },
];

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.replace("/(auth)/register");
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  return (
    <View className="flex-1 bg-background px-6 py-10">
      <View className="items-end">
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="button"
          accessibilityLabel="Saltar onboarding"
          accessibilityHint="Omitir introducción e ir a iniciar sesión"
        >
          <Text className="text-text-muted font-semibold">Saltar</Text>
        </Pressable>
      </View>

      <View className="flex-1 justify-center">
        <View className="rounded-3xl border border-border bg-surface px-6 py-10">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/20">
            {currentStep.icon}
          </View>

          <Text className="text-3xl font-bold text-text">{currentStep.title}</Text>
          <Text className="mt-4 text-base leading-6 text-text-muted">{currentStep.description}</Text>
        </View>

        <View className="mt-8 flex-row items-center justify-center gap-2">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === stepIndex ? "w-8 bg-primary" : "w-2 bg-border"}`}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Pressable
          onPress={handleNext}
          className="items-center rounded-2xl bg-primary px-4 py-4"
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? "Comenzar ahora" : "Siguiente paso"}
          accessibilityHint={isLastStep ? "Finaliza introducción e ir a registro" : "Avanza al siguiente paso"}
        >
          <Text className="text-lg font-bold text-black">{isLastStep ? "Comenzar" : "Siguiente"}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(auth)/register")}
          className="items-center rounded-2xl border border-border bg-surface px-4 py-4"
          accessibilityRole="button"
          accessibilityLabel="Ir a registro"
          accessibilityHint="Abrir pantalla para crear cuenta"
        >
          <Text className="font-semibold text-text">Crear cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}
