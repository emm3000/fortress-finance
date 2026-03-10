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
import { UserPlus, Mail, Lock, User } from "lucide-react-native";
import { getApiErrorMessage } from "../../utils/api-error";

const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitError(null);

    try {
      await AuthService.register(data);
      router.replace("/(main)");
    } catch (error: any) {
      const message = getApiErrorMessage(
        error,
        "No se pudo completar el registro. Intenta nuevamente."
      );
      setSubmitError(message);
      console.error(message);
    }
  };

  return (
    <AuthScreenShell
      icon={<UserPlus size={40} color="#FFD700" />}
      title={
        <>
          Nueva <Text className="text-primary">Guardia</Text>
        </>
      }
      subtitle="Comienza tu entrenamiento financiero"
    >
      <View className="space-y-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label="Nombre del Caballero"
              icon={<User size={20} color="#666" />}
              placeholder="Tu nombre"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label="Email"
              containerClassName="mt-4"
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
          accessibilityLabel="Registrar cuenta"
          accessibilityHint="Envía tus datos para crear una cuenta nueva"
          className="bg-primary mt-8"
          label="Registrar Escudo"
        />

        <InlineError message={submitError} />

        <View className="flex-row justify-center mt-6">
          <Text className="text-text-muted">¿Ya tienes rango? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a iniciar sesión"
              accessibilityHint="Abre la pantalla de acceso"
            >
              <Text className="text-primary font-bold">Inicia sesión</Text>
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
