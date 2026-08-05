import { useCallback } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { useAuth } from '@/hooks/useAuth';
import { PetCard } from '@/components/PetCard';
import { Card, Button, SkeletonCard, EmptyState, Badge } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights, statusLabel } from '@/theme';
import type { Pet } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const { list } = usePets();
  const pets = list.data ?? [];

  const onPetPress = useCallback((pet: Pet) => {
    router.push(`/(app)/pets/${pet.id}`);
  }, [router]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
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
          onPress={() => router.push('/(app)/queue')}
          accessibilityRole="button"
          accessibilityLabel="Consultar veterinario"
          accessibilityHint="Solicitá una consulta para tu mascota"
        >
          <View style={{ backgroundColor: c.primaryBg, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }}>
            <MaterialCommunityIcons name="stethoscope" size={32} color={c.primary} />
            <View>
              <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Consultar veterinario</Text>
              <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Atención profesional</Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/(app)/pets')}
          accessibilityRole="button"
          accessibilityLabel="Mis mascotas"
          accessibilityHint="Ver todas tus mascotas"
        >
          <View style={{ backgroundColor: c.accentBg, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }}>
            <MaterialCommunityIcons name="paw" size={32} color={c.accentDark} />
            <View>
              <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Mis mascotas</Text>
              <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Gestioná tus mascotas</Text>
            </View>
          </View>
        </Pressable>
      </View>

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
      ) : list.isError ? (
        <Card>
          <EmptyState
            icon="alert-circle-outline"
            title="Error al cargar"
            subtitle="No pudimos cargar tus mascotas. Revisá tu conexión."
            ctaLabel="Reintentar"
            onCta={() => list.refetch()}
          />
        </Card>
      ) : pets.length === 0 ? (
        <Card>
          <EmptyState icon="paw" title="Aún no tenés mascotas" subtitle="Cargá tu primera mascota para pedir consultas." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
        </Card>
      ) : (
        pets.map((pet: Pet) => (
          <PetCard key={pet.id} pet={pet} onPress={onPetPress} />
        ))
      )}
    </ScrollView>
  );
}
