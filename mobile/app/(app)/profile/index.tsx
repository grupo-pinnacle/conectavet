import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePets } from '@/hooks/usePets';
import { Card, Button, Badge, Avatar } from '@/components/ui';
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
  const { list } = usePets();
  const pets = list.data ?? [];

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Sin nombre';

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}>
      {/* Header con gradiente */}
      <View
        style={{
          borderRadius: radius.xl,
          padding: spacing.xl,
          marginBottom: spacing.lg,
          backgroundColor: c.primary,
          shadowColor: c.primary,
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              borderRadius: 49,
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.7)',
              overflow: 'hidden',
            }}
          >
            <Avatar uri={user?.photoUrl} name={fullName} size={92} />
          </View>
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.white, letterSpacing: -0.5 }}>
              {fullName}
            </Text>
            <Badge label={user ? roleLabel[user.role] : ''} bg="rgba(255,255,255,0.18)" color={c.white} size="sm" />
          </View>
        </View>
      </View>

      {/* Stats rápidas */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, borderRadius: radius.xl, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.lg, alignItems: 'center' }}>
          <MaterialCommunityIcons name="paw" size={22} color={c.primary} />
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginTop: spacing.xs }}>
            {pets.length}
          </Text>
          <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Mascotas</Text>
        </View>
        <View style={{ flex: 1, borderRadius: radius.xl, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.lg, alignItems: 'center' }}>
          <MaterialCommunityIcons name="shield-account" size={22} color={c.primary} />
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginTop: spacing.xs }}>
            {user?.isActive ? 'Activa' : 'Inactiva'}
          </Text>
          <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Cuenta</Text>
        </View>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Row icon="email-outline" label="Email" value={user?.email ?? '-'} />
        <View style={{ height: 1, backgroundColor: c.borderLight }} />
        <Row icon="phone-outline" label="Teléfono" value={user?.phone ?? 'Sin registrar'} />
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
