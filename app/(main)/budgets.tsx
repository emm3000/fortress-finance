import React, { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BudgetEditorCard } from "@/components/budgets/budget-editor-card";
import { BudgetList } from "@/components/budgets/budget-list";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets } from "@/hooks/useBudgets";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";
import { getApiErrorMessage } from "@/utils/api-error";

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { categoryName } = useLocalSearchParams<{ categoryName?: string | string[] }>();
  const {
    data: budgets = [],
    isLoading: isLoadingBudgets,
    upsertBudget,
    isSavingBudget,
  } = useBudgets();
  const { data: progressRows = [] } = useBudgetProgress();

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'EXPENSE'),
    [categories],
  );

  React.useEffect(() => {
    const categoryNameParam =
      typeof categoryName === 'string' ? categoryName.trim().toLowerCase() : '';
    if (!categoryNameParam) return;

    const matchedCategory = expenseCategories.find(
      (category) => category.name.trim().toLowerCase() === categoryNameParam,
    );
    if (matchedCategory) {
      setCategoryId(matchedCategory.id);
    }
  }, [categoryName, expenseCategories]);

  const progressByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of progressRows) {
      map[row.categoryId] = row.totalSpent;
    }
    return map;
  }, [progressRows]);

  const onSubmit = async () => {
    setSubmitError(null);

    const parsedAmount = Number(amount);
    if (!categoryId) {
      setSubmitError('Selecciona una categoría.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Ingresa un monto válido mayor a 0.');
      return;
    }

    try {
      await upsertBudget({
        categoryId,
        limitAmount: parsedAmount,
        period: 'MONTHLY',
      });
      setAmount('');
      setCategoryId('');
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, 'No se pudo guardar el presupuesto.'));
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader
        title='Presupuestos'
        onBack={() => router.back()}
        backAccessibilityHint='Regresa al dashboard'
      />

      <ScrollView
        className='px-6'
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
      >
        <BudgetEditorCard
          amount={amount}
          categories={expenseCategories}
          categoryId={categoryId}
          isSavingBudget={isSavingBudget}
          onAmountChange={setAmount}
          onCategoryChange={setCategoryId}
          onSubmit={() => void onSubmit()}
          submitError={submitError}
        />

        <BudgetList
          budgets={budgets}
          isLoading={isLoadingBudgets}
          onEdit={(budget) => {
            setCategoryId(budget.categoryId);
            setAmount(String(budget.limitAmount));
          }}
          progressByCategory={progressByCategory}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
