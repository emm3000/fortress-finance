import React from "react";
import {
  View,
  Text,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthService } from "../../services/auth.service";
import { InlineError } from "../../components/feedback/inline-error";
import { AuthScreenShell } from "../../components/layout/auth-screen-shell";
import { LabeledInput } from "../../components/ui/labeled-input";
import { AsyncButton } from "../../components/ui/async-button";
import { ShieldCheck, Mail, Lock } from "lucide-react-native";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);

    try {
      await AuthService.login(data);
      router.replace("/(main)");
    } catch (error: any) {
      const message = error?.response?.data?.message || "No se pudo iniciar sesión. Intenta nuevamente.";
      setSubmitError(message);
      console.error(message);
    }
  };

  return (
    <AuthScreenShell
      icon={<ShieldCheck size={40} color="#FFD700" />}
      title={
        <>
          Defensa de la <Text className="text-primary">Fortaleza</Text>
        </>
      }
      subtitle="Protege tu futuro financiero"
    >
      <View className="space-y-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label="Email"
              icon={<Mail size={20} color="#666" />}
              placeholder="tu@email.com"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label="Contraseña"
              containerClassName="mt-4"
              icon={<Lock size={20} color="#666" />}
              placeholder="••••••"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <AsyncButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          accessibilityHint="Envía tus credenciales para entrar al reino"
          className="bg-primary mt-8"
          label="Entrar al Reino"
        />

        <InlineError message={submitError} />

        <View className="items-center mt-2">
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recuperar contraseña"
              accessibilityHint="Abre el flujo para restablecer tu contraseña"
            >
              <Text className="text-primary text-sm font-medium">Olvidé mi contraseña</Text>
            </Pressable>
          </Link>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-text-muted">¿Eres nuevo recluta? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a registro"
              accessibilityHint="Abre la pantalla para crear una cuenta nueva"
            >
              <Text className="text-primary font-bold">Únete a la guardia</Text>
            </Pressable>
          </Link>
        </View>

        <View className="items-center mt-3">
          <Link href="/(auth)/onboarding" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver introducción"
              accessibilityHint="Vuelve a ver los pasos introductorios"
            >
              <Text className="text-text-muted underline">Ver introducción</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}
