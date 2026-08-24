import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterPayload, ApiError } from '@/types';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterPayload>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', phone: '' },
  });

  const onSubmit = async (values: RegisterPayload) => {
    setSubmitting(true);
    try {
      await register(values);
      Toast.show({ type: 'success', text1: 'Cuenta creada con éxito', text2: 'Bienvenido a VetConnect.' });
      router.replace('/(app)');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos crear tu cuenta. Intentá de nuevo.';
      Toast.show({ type: 'error', text1: 'Error al registrarte', text2: msg });
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
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
            Crear cuenta
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginTop: spacing.xs, textAlign: 'center', maxWidth: 300 }}>
            Registrá tus mascotas, consultá al asistente IA y pedí videollamadas veterinarias al instante.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <Input label="Nombre" placeholder="María" value={value} onChangeText={onChange} error={errors.firstName?.message} leftIcon="account-outline" />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <Input label="Apellido" placeholder="Pérez" value={value} onChangeText={onChange} error={errors.lastName?.message} />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Correo electrónico" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} error={errors.email?.message} leftIcon="email-outline" />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input label="Teléfono" placeholder="+54 11 5555-5555" keyboardType="phone-pad" value={value} onChangeText={onChange} error={errors.phone?.message} leftIcon="phone-outline" />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Contraseña" placeholder="8+ caracteres, 1 mayúscula, 1 número, 1 símbolo" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} leftIcon="lock-outline" hint="Mínimo 8 caracteres, una mayúscula, un número y un símbolo" />
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg" fullWidth style={{ marginTop: spacing.md }}>
            Crear cuenta
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg }}>
            <Text style={{ color: c.inkMuted, fontSize: fontSizes.body }}>¿Ya tenés cuenta? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')} accessibilityRole="button" accessibilityLabel="Iniciar sesión">
              <Text style={{ color: c.primary, fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}>Iniciar sesión</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
