import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Coins } from "lucide-react-native";

import { InlineError } from "@/components/feedback/inline-error";
import type { Category } from "@/db/category.repository";

type BudgetEditorCardProps = {
  amount: string;
  categories: Category[];
  categoryId: string;
  isSavingBudget: boolean;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubmit: () => void;
  submitError: string | null;
};

export function BudgetEditorCard({
  amount,
  categories,
  categoryId,
  isSavingBudget,
  onAmountChange,
  onCategoryChange,
  onSubmit,
  submitError,
}: BudgetEditorCardProps) {
  return (
    <View className="mt-4 p-4 bg-surface border border-border rounded-2xl">
      <Text className="text-text font-semibold text-base">Crear o editar presupuesto</Text>
      <Text className="text-text-muted text-xs mt-1">
        Si la categoría ya existe, se actualizará automáticamente.
      </Text>

      <Text className="text-text-muted text-xs mt-4 mb-2">Categoría</Text>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => onCategoryChange(category.id)}
            className={`px-3 py-2 rounded-full border ${
              categoryId === category.id
                ? "bg-primary/20 border-primary"
                : "bg-background border-border"
            }`}
          >
            <Text className={categoryId === category.id ? "text-primary font-semibold" : "text-text"}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-text-muted text-xs mt-4 mb-2">Límite mensual</Text>
      <View className="h-12 bg-background border border-border rounded-xl px-3 flex-row items-center">
        <Coins size={16} color="#FFD700" />
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="Ej: 500"
          keyboardType="decimal-pad"
          placeholderTextColor="#666"
          className="ml-2 flex-1 text-text"
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={isSavingBudget}
        className={`mt-4 h-12 rounded-xl items-center justify-center bg-primary ${
          isSavingBudget ? "opacity-60" : ""
        }`}
      >
        {isSavingBudget ? (
          <ActivityIndicator color="#111111" />
        ) : (
          <Text className="text-background font-bold">Guardar presupuesto</Text>
        )}
      </Pressable>

      <InlineError message={submitError} className="mt-3" />
    </View>
  );
}
