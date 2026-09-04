import { useCallback, useMemo } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { useAuth } from '@/hooks/useAuth';
import { useConsultationHistory } from '@/hooks/useConsultations';
import { PetCard } from '@/components/PetCard';
import { Card, Skeleton, SkeletonCard, EmptyState, Badge } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { Pet, Consultation } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const { list } = usePets();
  const { data: consultationsData, refetch: refetchConsultations } = useConsultationHistory({ limit: 10 });
  const pets = list.data ?? [];

  const activeConsultation = useMemo(() => {
    return (consultationsData ?? []).find(
      (cons: Consultation) => cons.status === 'WAITING' || cons.status === 'PENDING' || cons.status === 'ACTIVE'
    );
  }, [consultationsData]);

  const hour = new Date().getHours();
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const onPetPress = useCallback((pet: Pet) => {
    router.push(`/(app)/pets/${pet.id}`);
  }, [router]);

  const onRefreshAll = useCallback(() => {
    list.refetch();
    refetchConsultations();
  }, [list, refetchConsultations]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
      refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={onRefreshAll} tintColor={c.primary} />}
    >
      {!user ? (
        <View style={{ marginBottom: spacing.xl, gap: spacing.xs }}>
          <Skeleton width="60%" height={30} />
          <Skeleton width="80%" height={16} />
        </View>
      ) : (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
            {saludo}, {user?.firstName}
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginTop: spacing.xs }}>
            ¿Qué necesitás hacer hoy por tus mascotas?
          </Text>
        </View>
      )}

      {/* Banner de Consulta en Vivo / Cola con ETA */}
      {activeConsultation && (
        <Pressable
          onPress={() => router.push(`/(app)/chat/${activeConsultation.id}`)}
          style={{ marginBottom: spacing.xl }}
          accessibilityRole="button"
          accessibilityLabel="Consulta activa en curso"
        >
          <View
            style={{
              backgroundColor: activeConsultation.status === 'ACTIVE' ? c.successBg : c.primaryBg,
              borderRadius: radius.xl,
              borderWidth: 1.5,
              borderColor: activeConsultation.status === 'ACTIVE' ? c.success : c.primary,
              padding: spacing.lg,
              shadowColor: c.ink,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: activeConsultation.status === 'ACTIVE' ? c.success : c.accentDark,
                  }}
                />
                <Text style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: activeConsultation.status === 'ACTIVE' ? c.successDark : c.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {activeConsultation.status === 'ACTIVE'
                    ? '🟢 Consulta en curso'
                    : activeConsultation.status === 'PENDING'
                    ? '🔵 Veterinario asignado'
                    : '🟡 En cola de espera'}
                </Text>
              </View>
              {activeConsultation.status === 'WAITING' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full }}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={c.inkMuted} />
                  <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, fontWeight: fontWeights.semibold }}>~2-5 min</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginBottom: 2 }}>
              Paciente: {activeConsultation.pet?.name || 'Mascota'}
            </Text>
            <Text style={{ fontSize: fontSizes.label, color: c.inkSoft, marginBottom: spacing.md }}>
              {activeConsultation.vet
                ? `Atiende: Dr. ${activeConsultation.vet.firstName || activeConsultation.vet.email}`
                : 'Buscando el mejor veterinario de guardia disponible...'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
              <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.bold, color: c.primary }}>
                Entrar al chat y videollamada
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={c.primary} />
            </View>
          </View>
        </Pressable>
      )}

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

      <Pressable
        style={{ marginBottom: spacing.xl }}
        onPress={() => router.push('/(app)/vets')}
        accessibilityRole="button"
        accessibilityLabel="Buscar veterinarios"
        accessibilityHint="Explorá veterinarios por calificación y opiniones"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: c.border }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="account-search-outline" size={24} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Buscar veterinarios</Text>
            <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Elegí por calificación, opiniones y disponibilidad</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={c.inkMuted} />
        </View>
      </Pressable>

      <Pressable
        style={{ marginBottom: spacing.xl }}
        onPress={() => router.push('/(app)/pets?tab=history')}
        accessibilityRole="button"
        accessibilityLabel="Historial clínico"
        accessibilityHint="Revisá consultas, recetas y opiniones de tus mascotas"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: c.border }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={c.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Historial clínico</Text>
            <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Consultas, recetas y opiniones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={c.inkMuted} />
        </View>
      </Pressable>

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
