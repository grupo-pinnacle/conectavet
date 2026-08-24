import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVetCard } from '@/hooks/usePets';
import { Card, Badge, Button, SkeletonCard, EmptyState } from '@/components/ui';
import { AuthImage } from '@/components/AuthImage';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { formatAge, formatDate } from '@/utils/format';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { data: vetCard, isLoading, isError, error, refetch, isFetching } = useVetCard(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, padding: spacing.lg, gap: spacing.md }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          subtitle={(error as any)?.message ?? 'No pudimos cargar los datos de la mascota. Revisá tu conexión.'}
          ctaLabel="Reintentar"
          onCta={() => refetch()}
        />
      </View>
    );
  }

  if (!vetCard) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState icon="paw-off" title="No encontramos esta mascota" subtitle="Es posible que haya sido eliminada o no exista." />
      </View>
    );
  }

  const { pet, stats, allergies, chronicConditions, recentConsultations } = vetCard;
  const iconName = (speciesIcon[pet.species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.primary} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.ink} />
          </Pressable>
          <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, flex: 1 }}>{pet.name}</Text>
        </View>

        <Card padding={0} style={{ overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 100, height: 100, backgroundColor: c.primaryBg, borderTopLeftRadius: radius.xl, borderBottomLeftRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {pet.photoUrl ? (
                <AuthImage uri={pet.photoUrl} style={{ width: 100, height: 100 }} resizeMode="cover" accessibilityLabel={`Foto de ${pet.name}`} />
              ) : (
                <MaterialCommunityIcons name={iconName} size={50} color={c.primary} />
              )}
            </View>
            <View style={{ flex: 1, padding: spacing.lg, gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>{pet.name}</Text>
                {pet.isDeceased && <Badge label="En memoria" bg={c.inkMuted} icon="heart" size="sm" />}
              </View>
              <Text style={{ fontSize: fontSizes.body, color: c.inkSoft }}>{speciesLabel[pet.species]}{pet.breed ? ` · ${pet.breed}` : ''}</Text>
              <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>
                {formatAge(pet.birthDate)} · {pet.sex === 'MALE' ? 'Macho' : pet.sex === 'FEMALE' ? 'Hembra' : 'Sexo —'}
                {pet.weightKg ? ` · ${pet.weightKg} kg` : ''}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={spacing.lg}>
            <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="stethoscope" size={20} color={c.primary} />
            </View>
            <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.primary }}>{stats.totalConsultations}</Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, textAlign: 'center' }}>Consultas</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={spacing.lg}>
            <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.accentBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="calendar-outline" size={20} color={c.accentDark} />
            </View>
            <Text style={{ fontSize: fontSizes.input, fontWeight: fontWeights.bold, color: c.ink }}>{stats.lastConsultationDate ? formatDate(stats.lastConsultationDate) : '—'}</Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, textAlign: 'center' }}>Última consulta</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={spacing.lg}>
            <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.borderLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="chip" size={20} color={c.inkMuted} />
            </View>
            <Text style={{ fontSize: fontSizes.input, fontWeight: fontWeights.bold, color: c.ink }}>{pet.microchip ?? '—'}</Text>
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, textAlign: 'center' }}>Microchip</Text>
          </Card>
        </View>

        {(allergies.length > 0 || chronicConditions.length > 0) && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3, marginBottom: spacing.md }}>Alergias y condiciones</Text>
            {allergies.length > 0 && (
              <View style={{ marginBottom: chronicConditions.length > 0 ? spacing.md : 0 }}>
                <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, marginBottom: spacing.xs }}>Alergias</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {allergies.map((a: string) => <Badge key={a} label={a} variant="soft" bg={c.accentBg} color={c.accentDark} icon="alert" />)}
                </View>
              </View>
            )}
            {chronicConditions.length > 0 && (
              <View>
                <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, marginBottom: spacing.xs }}>Condiciones crónicas</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {chronicConditions.map((cond: string) => <Badge key={cond} label={cond} variant="filled" bg={c.danger} color={c.white} icon="alert-circle" />)}
                </View>
              </View>
            )}
          </Card>
        )}

        <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3, marginTop: spacing.xxl, marginBottom: spacing.md }}>Consultas recientes</Text>
        {recentConsultations.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={c.inkMuted} />
              <Text style={{ color: c.inkMuted, textAlign: 'center' }}>Sin consultas previas. Cuando solicites una consulta para {pet.name}, aparecerá acá.</Text>
            </View>
          </Card>
        ) : (
          recentConsultations.map((consult: { id: string; reason: string; status: string; completedAt: string | null }) => (
            <Card key={consult.id} style={{ marginBottom: spacing.md }} padding={spacing.lg}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink, flex: 1 }}>{consult.reason}</Text>
                <Badge label={consult.status === 'COMPLETED' ? 'Completada' : consult.status === 'CANCELLED' ? 'Cancelada' : consult.status === 'ACTIVE' ? 'En curso' : consult.status} bg={consult.status === 'COMPLETED' ? c.successBg : consult.status === 'CANCELLED' ? c.dangerBg : c.primaryBg} color={consult.status === 'COMPLETED' ? c.successDark : consult.status === 'CANCELLED' ? c.dangerDark : c.primary} size="sm" />
              </View>
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>{consult.completedAt ? formatDate(consult.completedAt) : ''}</Text>
            </Card>
          ))
        )}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Button variant="primary" onPress={() => router.push({ pathname: '/(app)/queue', params: { petId: pet.id } })} icon={<MaterialCommunityIcons name="stethoscope" size={18} color={c.white} />} style={{ flex: 1 }}>
            Solicitar consulta
          </Button>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
