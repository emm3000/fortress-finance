import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as Crypto from "expo-crypto";
import { CategoryRepository, Category } from "../../db/category.repository";
import { TransactionRepository } from "../../db/transaction.repository";
import { useSync } from "../../hooks/useSync";
import { useAuthStore } from "../../store/auth.store";
import { 
  ArrowLeft, 
  CircleDollarSign,
  FileText
} from "lucide-react-native";
import { MotiView } from "moti";

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Monto inválido"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().max(100, "Muy larga"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function NewTransactionScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { performSync } = useSync();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      description: "",
      categoryId: "",
    },
  });

  const transactionType = watch("type");

  useEffect(() => {
    async function loadCategories() {
      const data = await CategoryRepository.getAll();
      setCategories(data);
      setIsLoading(false);
    }
    loadCategories();
  }, []);

  const onSubmit = async (data: TransactionFormData) => {
    setSubmitError(null);

    if (!user) {
      setSubmitError("Tu sesión no está disponible. Inicia sesión nuevamente.");
      return;
    }

    try {
      const newTransaction = {
        id: Crypto.randomUUID(),
        user_id: user.id,
        category_id: data.categoryId,
        amount: Number(data.amount),
        description: data.description || "",
        date: new Date().toISOString(),
        type: data.type,
        is_synced: 0,
      };

      console.log("Submitting transaction:", newTransaction);
      console.log("Values array would be:", [
        newTransaction.id,
        newTransaction.user_id,
        newTransaction.category_id,
        newTransaction.amount,
        newTransaction.description,
        newTransaction.date,
        newTransaction.type,
        0
      ]);

      await TransactionRepository.create(newTransaction);
      
      // Sync in background and return
      performSync().catch(console.error);
      router.back();
    } catch (error: any) {
      const message = error?.response?.data?.message || "No se pudo guardar la transacción. Intenta nuevamente.";
      setSubmitError(message);
      console.error("Failed to save transaction:", error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="px-6">
          {/* Header */}
          <View className="flex-row items-center py-6">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={24} color="#FFD700" />
            </Pressable>
            <Text className="text-text text-xl font-bold ml-2">
              {transactionType === "EXPENSE" ? "Registrar Batalla" : "Botín de Guerra"}
            </Text>
          </View>

          {/* Type Toggle */}
          <View className="flex-row bg-surface rounded-2xl p-1 mb-8 border border-border">
            <Pressable
              onPress={() => setValue("type", "EXPENSE")}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl items-center ${
                transactionType === "EXPENSE" ? "bg-red-500/20 border border-red-500/50" : ""
              }`}
            >
              <Text className={transactionType === "EXPENSE" ? "text-red-400 font-bold" : "text-text-muted"}>
                Gasto ⚔️
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setValue("type", "INCOME")}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl items-center ${
                transactionType === "INCOME" ? "bg-green-500/20 border border-green-500/50" : ""
              }`}
            >
              <Text className={transactionType === "INCOME" ? "text-green-400 font-bold" : "text-text-muted"}>
                Ingreso 💰
              </Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} delay={100}>
            <Text className="text-text-muted mb-2 ml-1">Monto de Oro</Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 h-20">
                  <CircleDollarSign size={28} color="#FFD700" />
                  <TextInput
                    className="flex-1 text-text text-3xl font-bold ml-3"
                    placeholder="0.00"
                    placeholderTextColor="#444"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            {errors.amount ? <Text className="text-red-400 text-sm mt-1 ml-1">{errors.amount.message}</Text> : null}
          </MotiView>

          {/* Category Selector */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} delay={200} className="mt-6">
            <Text className="text-text-muted mb-2 ml-1">Categoría</Text>
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {isLoading ? (
                    <ActivityIndicator color="#FFD700" />
                  ) : (
                    categories
                      .filter((c) => c.type === transactionType)
                      .map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => setValue("categoryId", cat.id)}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-full border ${
                            value === cat.id
                              ? "bg-primary/20 border-primary"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text className={value === cat.id ? "text-primary font-bold" : "text-text-muted"}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      ))
                  )}
                </View>
              )}
            />
            {errors.categoryId ? <Text className="text-red-400 text-sm mt-1 ml-1">{errors.categoryId.message}</Text> : null}
          </MotiView>

          {/* Description */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} delay={300} className="mt-8">
            <Text className="text-text-muted mb-2 ml-1">Notas de Batalla</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 h-14">
                  <FileText size={20} color="#666" />
                  <TextInput
                    className="flex-1 text-text ml-3"
                    placeholder="¿En qué se gastó el oro?"
                    placeholderTextColor="#444"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
          </MotiView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`h-16 rounded-2xl items-center justify-center mt-12 mb-10 ${
              transactionType === "EXPENSE" ? "bg-red-600" : "bg-green-600"
            } ${isSubmitting ? "opacity-60" : ""}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-text font-bold text-lg">
                {transactionType === "EXPENSE" ? "Confirmar Gasto" : "Asegurar Botín"}
              </Text>
            )}
          </Pressable>

          {submitError ? (
            <Text className="text-red-400 text-sm -mt-6 mb-8 text-center">
              {submitError}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
