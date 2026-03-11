import React, { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as Crypto from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "../../hooks/useCategories";
import { TransactionRepository } from "../../db/transaction.repository";
import { useSync } from "../../hooks/useSync";
import { useAuthStore } from "../../store/auth.store";
import { AnalyticsService } from "../../services/analytics.service";
import { InlineError } from "../../components/feedback/inline-error";
import { ScreenHeader } from "../../components/ui/screen-header";
import { 
  CircleDollarSign,
  FileText,
  CalendarDays
} from "lucide-react-native";
import { MotiView } from "moti";
import { runWhenIdle } from "../../utils/idle";
import { getApiErrorMessage } from "../../utils/api-error";

const toTodayDateInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toStoredIsoDate = (dateInput: string) => {
  // Store a stable ISO value based on user-selected day (noon local avoids timezone edge cases).
  return new Date(`${dateInput}T12:00:00`).toISOString();
};

const toDateInput = (storedDate: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(storedDate)) return storedDate;
  return storedDate.slice(0, 10);
};

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Monto inválido"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)"),
  description: z.string().max(200, "Muy larga").optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function NewTransactionScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const { user } = useAuthStore();
  const { performSync } = useSync();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const editingTransactionId = typeof id === "string" && id.length > 0 ? id : undefined;

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
      date: toTodayDateInput(),
    },
  });

  const transactionType = watch("type");
  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === transactionType),
    [categories, transactionType]
  );
  const isEditing = !!editingTransactionId;

  useEffect(() => {
    if (!isEditing || !editingTransactionId || !user?.id) return;

    let isCancelled = false;
    setIsLoadingExisting(true);

    TransactionRepository.getById(editingTransactionId, user.id)
      .then((existing) => {
        if (isCancelled) return;
        if (!existing || existing.deleted_at) {
          setSubmitError("La transacción no existe o ya fue eliminada.");
          return;
        }
        setValue("type", existing.type);
        setValue("amount", String(existing.amount));
        setValue("categoryId", existing.category_id ?? "");
        setValue("date", toDateInput(existing.date));
        setValue("description", existing.description ?? "");
      })
      .catch(() => {
        if (isCancelled) return;
        setSubmitError("No se pudo cargar la transacción.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingExisting(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [editingTransactionId, isEditing, setValue, user?.id]);

  const onSubmit = async (data: TransactionFormData) => {
    setSubmitError(null);

    if (!user) {
      setSubmitError("Tu sesión no está disponible. Inicia sesión nuevamente.");
      return;
    }

    try {
      if (isEditing && editingTransactionId) {
        await TransactionRepository.update(editingTransactionId, user.id, {
          amount: Number(data.amount),
          type: data.type,
          category_id: data.categoryId,
          description: data.description || "",
          date: toStoredIsoDate(data.date),
        });
      } else {
        const now = new Date().toISOString();
        const newTransaction = {
          id: Crypto.randomUUID(),
          user_id: user.id,
          category_id: data.categoryId,
          amount: Number(data.amount),
          description: data.description || "",
          date: toStoredIsoDate(data.date),
          type: data.type,
          is_synced: 0,
          updated_at: now,
          deleted_at: null,
        };

        await TransactionRepository.create(newTransaction);
        AnalyticsService.track("transaction_created", {
          userId: user.id,
          type: data.type,
          amount: Number(data.amount),
          categoryId: data.categoryId,
          date: data.date,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["transactions", user.id] });

      router.back();

      // Defer background sync until UI interactions/transitions finish.
      runWhenIdle(() => {
        performSync().catch(() => {
          // Errors are surfaced through the sync hook/UI state when relevant.
        });
      });
    } catch (error: any) {
      const message = getApiErrorMessage(
        error,
        "No se pudo guardar la transacción. Inténtalo de nuevo."
      );
      setSubmitError(message);
      console.error("Failed to save transaction:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          <ScreenHeader
            title={
              isEditing
                ? "Editar transacción"
                : transactionType === "EXPENSE"
                  ? "Registrar Batalla"
                  : "Botín de Guerra"
            }
            onBack={() => router.back()}
            backAccessibilityHint="Regresa al dashboard"
            size="lg"
            bordered={false}
            withHorizontalPadding={false}
          />

          {isLoadingExisting ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#FFD700" />
            </View>
          ) : null}

          {/* Type Toggle */}
          <View className="flex-row bg-surface rounded-2xl p-1 mb-8 border border-border">
            <Pressable
              onPress={() => setValue("type", "EXPENSE")}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Tipo gasto"
              accessibilityHint="Selecciona que esta transacción es un gasto"
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
              accessibilityRole="button"
              accessibilityLabel="Tipo ingreso"
              accessibilityHint="Selecciona que esta transacción es un ingreso"
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
            <Text className="text-text-muted mb-2 ml-1">Monto de Oro (obligatorio)</Text>
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
            <Text className="text-text-muted mb-2 ml-1">Categoría (obligatorio)</Text>
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {isCategoriesLoading ? (
                    <ActivityIndicator color="#FFD700" />
                  ) : (
                    categoriesForType.map((cat) => (
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

          {/* Date */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            delay={260}
            className="mt-6"
          >
            <Text className="text-text-muted mb-2 ml-1">Fecha (obligatorio)</Text>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 h-14">
                  <CalendarDays size={20} color="#666" />
                  <TextInput
                    className="flex-1 text-text ml-3"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#444"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            {errors.date ? <Text className="text-red-400 text-sm mt-1 ml-1">{errors.date.message}</Text> : null}
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
            disabled={isSubmitting || isLoadingExisting}
            accessibilityRole="button"
            accessibilityLabel="Guardar transacción"
            accessibilityHint="Registra la transacción y vuelve al dashboard"
            className={`h-16 rounded-2xl items-center justify-center mt-12 mb-10 ${
              transactionType === "EXPENSE" ? "bg-red-600" : "bg-green-600"
            } ${isSubmitting || isLoadingExisting ? "opacity-60" : ""}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-text font-bold text-lg">
                {isEditing
                  ? "Guardar cambios"
                  : transactionType === "EXPENSE"
                    ? "Confirmar Gasto"
                    : "Asegurar Botín"}
              </Text>
            )}
          </Pressable>

          <InlineError message={submitError} className="-mt-6 mb-8 text-center" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
