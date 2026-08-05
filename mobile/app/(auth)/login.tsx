import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginPayload } from '@/types';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { ApiError } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const { control, handleSubmit, formState: { errors } } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const onSubmit = async (values: LoginPayload) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await login(values);
      Toast.show({ type: 'success', text1: 'Bienvenido a VetConnect', text2: 'Ya podés consultar con tus mascotas.' });
      router.replace('/(app)');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos iniciar sesión. Verificá tu email y contraseña.';
      setApiError(msg);
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: insets.top + spacing.massive, paddingBottom: insets.bottom + spacing.huge, backgroundColor: c.background }}
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
          {apiError && (
            <Animated.View
              entering={FadeIn}
              style={[{
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                backgroundColor: c.dangerBg, borderRadius: radius.lg,
                borderWidth: 1, borderColor: c.danger,
                padding: spacing.md,
              }, shakeStyle]}
            >
              <MaterialCommunityIcons name="alert-circle" size={20} color={c.danger} />
              <Text style={{ flex: 1, fontSize: fontSizes.body, color: c.danger, fontWeight: fontWeights.semibold }}>
                {apiError}
              </Text>
            </Animated.View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Correo electrónico" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={value} onChangeText={(v) => { setApiError(null); onChange(v); }} error={errors.email?.message} leftIcon="email-outline" />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Contraseña" placeholder="Ingresá tu contraseña" secureTextEntry value={value} onChangeText={(v) => { setApiError(null); onChange(v); }} error={errors.password?.message} leftIcon="lock-outline" />
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
