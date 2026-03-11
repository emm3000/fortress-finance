import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, Mail } from 'lucide-react-native';
import { AuthService } from '../../services/auth.service';
import { InlineError } from '../../components/feedback/inline-error';
import { AuthScreenShell } from '../../components/layout/auth-screen-shell';
import { LabeledInput } from '../../components/ui/labeled-input';
import { AsyncButton } from '../../components/ui/async-button';
import { getApiErrorMessage } from '../../utils/api-error';
import { captureException } from '../../services/monitoring.service';

const forgotSchema = z.object({
  email: z.string().email('Correo inválido'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const result = await AuthService.requestPasswordReset(data);
      setSuccessMessage(result.message);
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: data.email },
      });
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'No se pudo procesar la solicitud.');
      captureException(error, {
        screen: 'forgot-password',
        action: 'auth_request_password_reset',
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
          Recuperar <Text className='text-primary'>Contraseña</Text>
        </>
      }
      subtitle='Te enviaremos un codigo temporal para restablecer tu acceso.'
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

        <AsyncButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          className='bg-primary mt-8'
          label='Solicitar codigo'
          accessibilityRole='button'
          accessibilityLabel='Solicitar recuperación'
          accessibilityHint='Solicita un codigo de recuperacion para restablecer contraseña'
        />

        {successMessage ? <Text className='text-green-400 text-sm mt-3'>{successMessage}</Text> : null}
        <InlineError message={submitError} />

        <View className='flex-row justify-center mt-6'>
          <Text className='text-text-muted'>¿Recordaste tu clave? </Text>
          <Link href='/(auth)/login' asChild>
            <Pressable>
              <Text className='text-primary font-bold'>Volver al login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}
