import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePets } from '@/hooks/usePets';
import { Card, Button, Badge } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { Role } from '@/types';

const roleLabel: Record<Role, string> = {
  CLIENT: 'Dueño de mascotas',
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

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Tutor de Mascotas';
  const initials = (fullName.charAt(0) || 'U').toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026';
  const isAccountActive = user?.isActive !== false;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: spacing.md,
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.huge,
        backgroundColor: c.background,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
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
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: c.surface,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.7)',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.primary }}>
                {initials}
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.white, letterSpacing: -0.5, textAlign: 'center' }}>
                {fullName}
              </Text>
              <Badge
                label={user ? (roleLabel[user.role] || 'Dueño de mascotas') : 'Usuario'}
                bg="rgba(255,255,255,0.22)"
                color={c.white}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Stats rápidas responsive */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <View style={{ flex: 1, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.md, alignItems: 'center' }}>
            <MaterialCommunityIcons name="paw" size={24} color={c.primary} />
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginTop: spacing.xs }}>
              {pets.length}
            </Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Mascotas</Text>
          </View>
          <View style={{ flex: 1, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.md, alignItems: 'center' }}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: '#10B981', marginTop: spacing.xs }}>
              {isAccountActive ? 'Activa' : 'Inactiva'}
            </Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Estado</Text>
          </View>
          <View style={{ flex: 1, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.md, alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={c.primary} />
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginTop: spacing.xs }}>
              {memberSince}
            </Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Miembro</Text>
          </View>
        </View>

        {/* Mascotas registradas preview */}
        {pets.length > 0 && (
          <View style={{ marginBottom: spacing.lg, borderRadius: radius.xl, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight, padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.ink }}>
                Mis Pacientes / Mascotas
              </Text>
              <Pressable onPress={() => router.push('/(app)/pets')}>
                <Text style={{ fontSize: fontSizes.caption, color: c.primary, fontWeight: fontWeights.semibold }}>
                  Ver todas ({pets.length})
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {pets.map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    backgroundColor: c.primaryBg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                  }}
                >
                  <MaterialCommunityIcons name="paw" size={14} color={c.primary} />
                  <Text style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: c.primary }}>
                    {p.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Datos de contacto y perfil */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Row icon="email-outline" label="Correo Electrónico" value={user?.email ?? '-'} />
          <View style={{ height: 1, backgroundColor: c.borderLight }} />
          <Row icon="phone-outline" label="Teléfono de Contacto" value={user?.phone || 'Sin registrar'} />
          {user?.specialty && (
            <>
              <View style={{ height: 1, backgroundColor: c.borderLight }} />
              <Row icon="stethoscope" label="Especialidad Veterinaria" value={user.specialty} />
            </>
          )}
          {user?.bio && (
            <>
              <View style={{ height: 1, backgroundColor: c.borderLight }} />
              <Row icon="note-text-outline" label="Biografía / Presentación" value={user.bio} />
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
          Editar información personal
        </Button>

        <Pressable
          onPress={() => logout()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <MaterialCommunityIcons name="logout-variant" size={20} color={c.danger} />
          <Text style={{ fontSize: fontSizes.body, color: c.danger, fontWeight: fontWeights.semibold }}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
