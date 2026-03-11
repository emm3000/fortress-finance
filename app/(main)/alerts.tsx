import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, ShieldAlert, ShieldCheck, Store } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/screen-header';
import { EmptyState } from '../../components/feedback/empty-state';
import { useNotifications } from '../../hooks/useNotifications';

const iconByType: Record<'ATTACK' | 'REWARD' | 'SHOP', React.ReactNode> = {
  ATTACK: <ShieldAlert size={18} color='#f87171' />,
  REWARD: <ShieldCheck size={18} color='#4ade80' />,
  SHOP: <Store size={18} color='#facc15' />,
};

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { data: notifications = [], isLoading, isError } = useNotifications();

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader
        title='Centro de alertas'
        onBack={() => router.back()}
        backAccessibilityHint='Regresa al dashboard'
      />

      <ScrollView
        className='px-6'
        contentContainerStyle={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom + 24, 32) }}
      >
        {isLoading ? (
          <View className='py-10 items-center'>
            <ActivityIndicator color='#FFD700' />
          </View>
        ) : notifications.length === 0 || isError ? (
          <EmptyState
            icon={<Bell size={56} color='#444' />}
            title='Sin alertas por ahora'
            description='Cuando haya novedades de presupuestos o recompensas aparecerán aquí.'
          />
        ) : (
          notifications.map((notification) => {
            const shouldOpenBudgets =
              notification.type === 'ATTACK' && notification.title.includes('Presupuesto');
            const categoryName =
              shouldOpenBudgets && notification.title.includes(':')
                ? notification.title.split(':').slice(1).join(':').trim()
                : '';

            return (
              <Pressable
                key={notification.id}
                onPress={() => {
                  if (shouldOpenBudgets) {
                    router.push({
                      pathname: '/(main)/budgets',
                      params: { categoryName },
                    });
                    return;
                  }
                  router.push('/(main)');
                }}
                className='mb-3 p-4 bg-surface border border-border rounded-2xl'
                accessibilityRole='button'
                accessibilityLabel='Abrir detalle de alerta'
                accessibilityHint='Navega a la pantalla relacionada con esta alerta'
              >
                <View className='flex-row items-start'>
                  <View className='w-9 h-9 rounded-lg bg-background border border-border items-center justify-center'>
                    {iconByType[notification.type] ?? <Bell size={18} color='#9ca3af' />}
                  </View>
                  <View className='ml-3 flex-1'>
                    <Text className='text-text font-semibold'>{notification.title}</Text>
                    <Text className='text-text-muted text-sm mt-1'>{notification.body}</Text>
                    <Text className='text-text-muted text-[11px] mt-2'>
                      {Number.isNaN(new Date(notification.createdAt).getTime())
                        ? 'Fecha no disponible'
                        : new Date(notification.createdAt).toLocaleString()}
                    </Text>
                    {shouldOpenBudgets ? (
                      <Text className='text-primary text-xs mt-2'>Ir a presupuestos</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
