import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthService } from "../../services/auth.service";
import { ShieldCheck, Mail, Lock } from "lucide-react-native";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await AuthService.login(data);
      router.replace("/(main)");
    } catch (error: any) {
      console.error(error.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 justify-center py-12">
          {/* Logo/Icon section */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center border-2 border-primary">
              <ShieldCheck size={40} color="#FFD700" />
            </View>
            <Text className="text-text text-3xl font-bold mt-4 text-center">
              Defensa de la <Text className="text-primary">Fortaleza</Text>
            </Text>
            <Text className="text-text-muted text-center mt-2">
              Protege tu futuro financiero
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-300 mb-2 ml-1">Email</Text>
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
              {errors.email && (
                <Text className="text-red-400 text-sm mt-1 ml-1">
                  {errors.email.message}
                </Text>
              )}
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
              {errors.password && (
                <Text className="text-red-400 text-sm mt-1 ml-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className="bg-primary h-14 rounded-xl items-center justify-center mt-8 active:opacity-80"
            >
              <Text className="text-background font-bold text-lg">
                Entrar al Reino
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-text-muted">¿Eres nuevo recluta? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-bold">Únete a la guardia</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
