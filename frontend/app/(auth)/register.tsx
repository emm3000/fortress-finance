import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthService } from "../../services/auth.service";
import { InlineError } from "../../components/feedback/inline-error";
import { UserPlus, Mail, Lock, User } from "lucide-react-native";

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
      const message = error?.response?.data?.message || "No se pudo completar el registro. Intenta nuevamente.";
      setSubmitError(message);
      console.error(message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 justify-center py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center border-2 border-primary">
              <UserPlus size={40} color="#FFD700" />
            </View>
            <Text className="text-text text-3xl font-bold mt-4 text-center">
              Nueva <Text className="text-primary">Guardia</Text>
            </Text>
            <Text className="text-text-muted text-center mt-2">
              Comienza tu entrenamiento financiero
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-300 mb-2 ml-1">Nombre del Caballero</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 h-14">
                    <User size={20} color="#666" />
                    <TextInput
                      className="flex-1 text-text ml-3"
                      placeholder="Tu nombre"
                      placeholderTextColor="#666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.name ? (
                <Text className="text-red-400 text-sm mt-1 ml-1">
                  {errors.name.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-gray-300 mb-2 mt-4 ml-1">Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 h-14">
                    <Mail size={20} color="#666" />
                    <TextInput
                      className="flex-1 text-text ml-3"
                      placeholder="tu@email.com"
                      placeholderTextColor="#666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                )}
              />
              {errors.email ? (
                <Text className="text-red-400 text-sm mt-1 ml-1">
                  {errors.email.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-gray-300 mb-2 mt-4 ml-1">Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 h-14">
                    <Lock size={20} color="#666" />
                    <TextInput
                      className="flex-1 text-text ml-3"
                      placeholder="••••••"
                      placeholderTextColor="#666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                    />
                  </View>
                )}
              />
              {errors.password ? (
                <Text className="text-red-400 text-sm mt-1 ml-1">
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Registrar cuenta"
              accessibilityHint="Envía tus datos para crear una cuenta nueva"
              className={`bg-primary h-14 rounded-xl items-center justify-center mt-8 active:opacity-80 ${
                isSubmitting ? "opacity-60" : ""
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0F0F0F" />
              ) : (
                <Text className="text-background font-bold text-lg">
                  Registrar Escudo
                </Text>
              )}
            </Pressable>

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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
