import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginPayload } from '@/types';
import { colors } from '@/theme';
import { ApiError } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginPayload) => {
    setSubmitting(true);
    try {
      await login(values);
      Toast.show({ type: 'success', text1: '¡Bienvenido a VetConnect!' });
      router.replace('/(app)');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 56 }}>🐾</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: 8 }}>
            VetConnect
          </Text>
          <Text style={{ fontSize: 14, color: colors.inkMuted, marginTop: 4 }}>
            Telesalud veterinaria en tu bolsillo
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                placeholder="vos@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg" style={{ marginTop: 8 }}>
            Iniciar sesión
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>¿No tenés cuenta? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Registrate
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
