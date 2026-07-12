import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginPayload } from '@/types';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { ApiError } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginPayload) => {
    setSubmitting(true);
    try {
      await login(values);
      Toast.show({ type: 'success', text1: 'Bienvenido a VetConnect', text2: 'Ya podés consultar con tus mascotas.' });
      router.replace('/(app)');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos iniciar sesión. Verificá tu email y contraseña.';
      Toast.show({ type: 'error', text1: 'Error al iniciar sesión', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xxl, justifyContent: 'center', backgroundColor: c.background }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.huge }}>
          <View style={{ width: 80, height: 80, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialCommunityIcons name="paw" size={44} color={c.primary} />
          </View>
          <Text style={{ fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
            VetConnect
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginTop: spacing.xs }}>
            Telesalud veterinaria, siempre al alcance
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Correo electrónico" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} error={errors.email?.message} leftIcon="email-outline" />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Contraseña" placeholder="Ingresá tu contraseña" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} leftIcon="lock-outline" />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg" fullWidth style={{ marginTop: spacing.md }}>
            Iniciar sesión
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg }}>
            <Text style={{ color: c.inkMuted, fontSize: fontSizes.body }}>¿No tenés cuenta? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')} accessibilityRole="button" accessibilityLabel="Crear cuenta">
              <Text style={{ color: c.primary, fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}>Registrate</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
