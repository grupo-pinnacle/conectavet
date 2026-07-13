import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl, backgroundColor: c.background, gap: spacing.lg }}>
        <View style={{ width: 80, height: 80, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="paw-off" size={40} color={c.primary} />
        </View>
        <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, textAlign: 'center' }}>
          Página no encontrada
        </Text>
        <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, textAlign: 'center', maxWidth: 280 }}>
          Es posible que el link haya expirado o que la pantalla no exista.
        </Text>
        <Link href="/(app)" style={{ color: c.primary, fontWeight: fontWeights.semibold, fontSize: fontSizes.body, marginTop: spacing.md }}>
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
