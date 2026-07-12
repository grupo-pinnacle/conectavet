import { View, Text, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { PetCard } from '@/components/PetCard';
import { Card, Button, SkeletonCard, EmptyState, Badge } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights, statusLabel } from '@/theme';
import type { Pet } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const { list } = usePets();
  const { myEntry } = useQueue();
  const pets = list.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}
      refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} tintColor={c.primary} />}
    >
      <View style={{ marginBottom: spacing.xxl }}>
        <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
          Hola, {user?.firstName}
        </Text>
        <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginTop: spacing.xs }}>
          ¿Qué necesitás hacer hoy por tus mascotas?
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/(app)/chat')}
          accessibilityRole="button"
          accessibilityLabel="Consultar al asistente IA"
          accessibilityHint="Abrí el chat con el asistente virtual para resolver dudas no urgentes"
        >
          <View style={{ backgroundColor: c.primaryBg, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }}>
            <MaterialCommunityIcons name="chat-processing" size={32} color={c.primary} />
            <View>
              <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Asistente IA</Text>
              <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Dudas no urgentes</Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/(app)/queue')}
          accessibilityRole="button"
          accessibilityLabel="Pedir videollamada"
          accessibilityHint="Unite a la cola de espera para una videollamada con un veterinario"
        >
          <View style={{ backgroundColor: c.accentBg, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }}>
            <MaterialCommunityIcons name="video-outline" size={32} color={c.accentDark} />
            <View>
              <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Videollamada</Text>
              <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Atención en vivo</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {myEntry && myEntry.status !== 'COMPLETED' && myEntry.status !== 'CANCELLED' && (
        <Pressable onPress={() => router.push('/(app)/queue')} style={{ marginBottom: spacing.xl }} accessibilityRole="button" accessibilityLabel="Ver consulta en curso">
          <Card variant="outlined">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.semibold, color: c.ink }}>Consulta en curso</Text>
                <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, marginTop: 1 }} numberOfLines={1}>{myEntry.reason}</Text>
              </View>
              <Badge
                label={myEntry.status === 'ASSIGNED' ? 'Listo' : 'En espera'}
                variant="soft"
                bg={myEntry.status === 'ASSIGNED' ? c.successBg : c.accentBg}
                color={myEntry.status === 'ASSIGNED' ? c.successDark : c.accentDark}
                icon={myEntry.status === 'ASSIGNED' ? 'check-circle' : 'clock-outline'}
              />
            </View>
          </Card>
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Tus mascotas</Text>
        <Pressable onPress={() => router.push('/(app)/pets/new')} accessibilityRole="button" accessibilityLabel="Agregar nueva mascota">
          <Text style={{ fontSize: fontSizes.body, color: c.primary, fontWeight: fontWeights.semibold }}>+ Nueva</Text>
        </Pressable>
      </View>

      {list.isLoading ? (
        <View style={{ gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : pets.length === 0 ? (
        <Card>
          <EmptyState icon="paw" title="Aún no tenés mascotas" subtitle="Cargá tu primera mascota para pedir consultas y chatear con la IA." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
        </Card>
      ) : (
        pets.map((pet: Pet) => (
          <PetCard key={pet.id} pet={pet} onPress={() => router.push(`/(app)/pets/${pet.id}`)} />
        ))
      )}
    </ScrollView>
  );
}
