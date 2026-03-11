import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, KeyRound, Mail } from 'lucide-react-native';
import { AuthService } from '../../services/auth.service';
import { InlineError } from '../../components/feedback/inline-error';
import { AuthScreenShell } from '../../components/layout/auth-screen-shell';
import { LabeledInput } from '../../components/ui/labeled-input';
import { AsyncButton } from '../../components/ui/async-button';
import { getApiErrorMessage } from '../../utils/api-error';
import { captureException } from '../../services/monitoring.service';

const resetSchema = z
  .object({
    email: z.string().email('Correo inválido'),
    token: z.string().min(6, 'Codigo inválido'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const { token, email } = useLocalSearchParams<{
    token?: string | string[];
    email?: string | string[];
  }>();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const initialToken = typeof token === 'string' ? token : '';
  const initialEmail = typeof email === 'string' ? email : '';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await AuthService.confirmPasswordReset({
        email: data.email,
        token: data.token,
        newPassword: data.newPassword,
      });

      setSuccessMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 800);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'No se pudo restablecer la contraseña.');
      captureException(error, {
        screen: 'reset-password',
        action: 'auth_confirm_password_reset',
        uiMessage: message,
      });
      setSubmitError(message);
    }
  };

  return (
    <AuthScreenShell
      icon={<KeyRound size={40} color='#FFD700' />}
      title={
        <>
          Nueva <Text className='text-primary'>Contraseña</Text>
        </>
      }
      subtitle='Ingresa el codigo temporal y define una clave nueva.'
    >
      <View className='space-y-4'>
        <Controller
          control={control}
          name='email'
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label='Email'
              icon={<Mail size={20} color='#666' />}
              placeholder='tu@email.com'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize='none'
              keyboardType='email-address'
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name='token'
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label='Codigo'
              icon={<KeyRound size={20} color='#666' />}
              placeholder='Pega el codigo recibido'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize='none'
              error={errors.token?.message}
            />
          )}
        />

        <Controller
          control={control}
          name='newPassword'
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label='Nueva contraseña'
              containerClassName='mt-4'
              icon={<Lock size={20} color='#666' />}
              placeholder='••••••'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.newPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name='confirmPassword'
          render={({ field: { onChange, onBlur, value } }) => (
            <LabeledInput
              label='Confirmar contraseña'
              containerClassName='mt-4'
              icon={<Lock size={20} color='#666' />}
              placeholder='••••••'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <AsyncButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          className='bg-primary mt-8'
          label='Actualizar contraseña'
          accessibilityRole='button'
          accessibilityLabel='Confirmar recuperación'
          accessibilityHint='Actualiza tu contraseña usando el codigo temporal'
        />

        {successMessage ? <Text className='text-green-400 text-sm mt-3'>{successMessage}</Text> : null}
        <InlineError message={submitError} />

        <View className='flex-row justify-center mt-6'>
          <Text className='text-text-muted'>¿No tienes codigo? </Text>
          <Link href='/(auth)/forgot-password' asChild>
            <Pressable>
              <Text className='text-primary font-bold'>Solicitar nuevamente</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}
