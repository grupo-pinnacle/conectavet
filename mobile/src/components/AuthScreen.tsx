import { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register, isLoading, sessionExpired, clearSessionExpired } = useAuthStore();
  const { colors: c } = useTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo completar. Verificá tus datos.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xxl }}>
        {sessionExpired && (
          <View style={{ marginBottom: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.dangerBg }}>
            <Text style={{ color: c.danger, fontSize: fontSizes.body }}>Tu sesión expiró. Iniciá de nuevo.</Text>
            <TouchableOpacity onPress={clearSessionExpired}><Text style={{ color: c.primary, marginTop: 4 }}>Entendido</Text></TouchableOpacity>
          </View>
        )}

        <Text style={{ fontSize: fontSizes.h1, fontWeight: fontWeights.bold, color: c.ink }}>VetConnect</Text>
        <Text style={{ color: c.textMuted, marginTop: 4, marginBottom: spacing.xl }}>
          {mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
        </Text>

        {mode === 'register' && (
          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" autoComplete="name" />
        )}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="email"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          leftIcon="lock"
        />

        {error && <Text style={{ color: c.danger, marginBottom: spacing.md }}>{error}</Text>}

        <Button loading={isLoading} onPress={submit}>
          {mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}
        </Button>

        <TouchableOpacity
          style={{ marginTop: spacing.lg, alignItems: 'center' }}
          onPress={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          <Text style={{ color: c.primary }}>
            {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
