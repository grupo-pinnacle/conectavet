import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 56 }}>🐾</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 12 }}>
          Página no encontrada
        </Text>
        <Text style={{ fontSize: 14, color: colors.inkMuted, marginTop: 4, marginBottom: 16 }}>
          Es posible que el link haya expirado o que la pantalla no exista.
        </Text>
        <Link href="/(app)" style={{ color: colors.primary, fontWeight: '600' }}>
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
