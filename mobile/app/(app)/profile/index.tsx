import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, Card, Button, Badge } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { Role } from '@/types';

const roleLabel: Record<Role, string> = {
  OWNER: 'Dueño de mascotas',
  VET: 'Veterinario/a',
  ADMIN: 'Administrador',
};

function Row({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.lg, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name={icon} size={20} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>{label}</Text>
        <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.semibold }} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { user, logout } = useAuth();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Sin nombre';

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}>
      <View style={{ alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
        <Avatar name={fullName} size={88} />
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
            {fullName}
          </Text>
          <Badge label={user ? roleLabel[user.role] : ''} bg={c.primaryBg} color={c.primary} size="sm" />
        </View>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Row icon="email-outline" label="Email" value={user?.email ?? '-'} />
        <View style={{ height: 1, backgroundColor: c.borderLight }} />
        <Row icon="phone-outline" label="Teléfono" value={user?.phone ?? '-'} />
        {user?.specialty && (
          <>
            <View style={{ height: 1, backgroundColor: c.borderLight }} />
            <Row icon="stethoscope" label="Especialidad" value={user.specialty} />
          </>
        )}
        {user?.bio && (
          <>
            <View style={{ height: 1, backgroundColor: c.borderLight }} />
            <Row icon="note-text-outline" label="Bio" value={user.bio} />
          </>
        )}
      </Card>

      <Button
        variant="primary"
        onPress={() => router.push('/(app)/profile/edit')}
        icon={<MaterialCommunityIcons name="pencil-outline" size={18} color={c.white} />}
        style={{ marginBottom: spacing.md }}
        accessibilityLabel="Editar perfil"
      >
        Editar perfil
      </Button>

      <Pressable
        onPress={() => logout()}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md }}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <MaterialCommunityIcons name="logout-variant" size={20} color={c.danger} />
        <Text style={{ fontSize: fontSizes.body, color: c.danger, fontWeight: fontWeights.semibold }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
