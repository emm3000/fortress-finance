import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CheckCircle2, Coins, Pencil, ShieldAlert } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/screen-header';
import { InlineError } from '../../components/feedback/inline-error';
import { EmptyState } from '../../components/feedback/empty-state';
import { useCategories } from '../../hooks/useCategories';
import { useBudgets } from '../../hooks/useBudgets';
import { useBudgetProgress } from '../../hooks/useBudgetProgress';
import { getApiErrorMessage } from '../../utils/api-error';

type Status = 'NORMAL' | 'RISK' | 'EXCEEDED';

const getStatus = (spent: number, limit: number): Status => {
  if (limit <= 0) return 'NORMAL';
  const ratio = spent / limit;
  if (ratio >= 1) return 'EXCEEDED';
  if (ratio >= 0.8) return 'RISK';
  return 'NORMAL';
};

const STATUS_UI: Record<
  Status,
  { label: string; colorClass: string; barClass: string; icon: React.ReactNode }
> = {
  NORMAL: {
    label: 'Normal',
    colorClass: 'text-green-400',
    barClass: 'bg-green-500',
    icon: <CheckCircle2 size={14} color='#4ade80' />,
  },
  RISK: {
    label: 'Riesgo',
    colorClass: 'text-yellow-400',
    barClass: 'bg-yellow-500',
    icon: <AlertTriangle size={14} color='#facc15' />,
  },
  EXCEEDED: {
    label: 'Excedido',
    colorClass: 'text-red-400',
    barClass: 'bg-red-500',
    icon: <ShieldAlert size={14} color='#f87171' />,
  },
};

export default function BudgetsScreen() {
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

      <ScrollView className='px-6' contentContainerStyle={{ paddingBottom: 24 }}>
        <View className='mt-4 p-4 bg-surface border border-border rounded-2xl'>
          <Text className='text-text font-semibold text-base'>Crear o editar presupuesto</Text>
          <Text className='text-text-muted text-xs mt-1'>
            Si la categoría ya existe, se actualizará automáticamente.
          </Text>

          <Text className='text-text-muted text-xs mt-4 mb-2'>Categoría</Text>
          <View className='flex-row flex-wrap gap-2'>
            {expenseCategories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                className={`px-3 py-2 rounded-full border ${
                  categoryId === category.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <Text className={categoryId === category.id ? 'text-primary font-semibold' : 'text-text'}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className='text-text-muted text-xs mt-4 mb-2'>Límite mensual</Text>
          <View className='h-12 bg-background border border-border rounded-xl px-3 flex-row items-center'>
            <Coins size={16} color='#FFD700' />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder='Ej: 500'
              keyboardType='decimal-pad'
              placeholderTextColor='#666'
              className='ml-2 flex-1 text-text'
            />
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={isSavingBudget}
            className={`mt-4 h-12 rounded-xl items-center justify-center bg-primary ${isSavingBudget ? 'opacity-60' : ''}`}
          >
            {isSavingBudget ? (
              <ActivityIndicator color='#111111' />
            ) : (
              <Text className='text-background font-bold'>Guardar presupuesto</Text>
            )}
          </Pressable>

          <InlineError message={submitError} className='mt-3' />
        </View>

        <View className='mt-6'>
          <Text className='text-text font-semibold text-base mb-3'>Tus presupuestos activos</Text>

          {isLoadingBudgets ? (
            <View className='py-10 items-center'>
              <ActivityIndicator color='#FFD700' />
            </View>
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={<Coins size={52} color='#444' />}
              title='Sin presupuestos aún'
              description='Crea tu primer límite mensual para controlar mejor tus gastos.'
            />
          ) : (
            budgets.map((budget) => {
              const spent = progressByCategory[budget.categoryId] ?? 0;
              const percent = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
              const safePercent = Math.max(0, Math.min(100, percent));
              const status = getStatus(spent, budget.limitAmount);
              const statusUi = STATUS_UI[status];

              return (
                <View key={budget.id} className='mb-3 p-4 bg-surface rounded-2xl border border-border'>
                  <View className='flex-row justify-between items-center'>
                    <Text className='text-text font-semibold text-base'>{budget.category.name}</Text>
                    <View className='flex-row items-center'>
                      {statusUi.icon}
                      <Text className={`ml-1 text-xs font-semibold ${statusUi.colorClass}`}>
                        {statusUi.label}
                      </Text>
                    </View>
                  </View>

                  <Text className='text-text-muted text-xs mt-2'>
                    Gastado {spent.toFixed(2)} / Límite {budget.limitAmount.toFixed(2)}
                  </Text>

                  <View className='mt-2 h-2 rounded-full bg-background border border-border overflow-hidden'>
                    <View className={`h-full ${statusUi.barClass}`} style={{ width: `${safePercent}%` }} />
                  </View>

                  <Pressable
                    onPress={() => {
                      setCategoryId(budget.categoryId);
                      setAmount(String(budget.limitAmount));
                    }}
                    className='mt-3 self-start px-3 py-2 rounded-lg border border-border flex-row items-center'
                  >
                    <Pencil size={14} color='#9ca3af' />
                    <Text className='ml-2 text-text-muted text-xs'>Editar límite</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
