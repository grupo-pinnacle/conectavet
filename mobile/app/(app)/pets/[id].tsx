import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useVetCard } from '@/hooks/usePets';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { colors, speciesEmoji, speciesLabel, statusColors, statusLabel } from '@/theme';
import { formatAge, formatDate, formatDateTime } from '@/utils/format';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: vetCard, isLoading, refetch, isFetching } = useVetCard(id);

  if (isLoading) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!vetCard) {
    return (
      <View style={{ padding: 16 }}>
        <Card>
          <Text style={{ color: colors.inkMuted }}>No se encontró la mascota.</Text>
        </Card>
      </View>
    );
  }

  const { pet, stats, allergies, chronicConditions, recentConsultations } = vetCard;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <Card padding={0}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.border,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 50 }}>{speciesEmoji[pet.species] ?? '🐾'}</Text>
          </View>
          <View style={{ flex: 1, padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{pet.name}</Text>
            <Text style={{ fontSize: 14, color: colors.inkSoft }}>
              {speciesLabel[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </Text>
            <Text style={{ fontSize: 13, color: colors.inkMuted }}>
              {formatAge(pet.birthDate)} · {pet.sex === 'MALE' ? '♂ Macho' : pet.sex === 'FEMALE' ? '♀ Hembra' : 'Sexo —'}
              {pet.weightKg ? ` · ${pet.weightKg} kg` : ''}
            </Text>
            {pet.isDeceased && <Badge label="🌈 En memoria" bg={colors.inkMuted} />}
          </View>
        </View>
      </Card>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
            {stats.totalConsultations}
          </Text>
          <Text style={{ fontSize: 11, color: colors.inkMuted, textAlign: 'center' }}>
            Consultas
          </Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
            {stats.lastConsultationDate ? formatDate(stats.lastConsultationDate) : '—'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.inkMuted, textAlign: 'center' }}>
            Última consulta
          </Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
            {pet.microchip ?? '—'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.inkMuted, textAlign: 'center' }}>
            Microchip
          </Text>
        </Card>
      </View>

      {/* Allergies / Conditions */}
      {(allergies.length > 0 || chronicConditions.length > 0) && (
        <Card style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
            ⚠ Alergias y condiciones
          </Text>
          {allergies.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: colors.inkMuted, marginBottom: 4 }}>Alergias</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {allergies.map((a: string) => (
                  <Badge key={a} label={a} bg={colors.accentDark} color="#fff" />
                ))}
              </View>
            </View>
          )}
          {chronicConditions.length > 0 && (
            <View>
              <Text style={{ fontSize: 12, color: colors.inkMuted, marginBottom: 4 }}>Condiciones crónicas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {chronicConditions.map((c: string) => (
                  <Badge key={c} label={c} bg={colors.danger} color="#fff" />
                ))}
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Recent consultations */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 20, marginBottom: 8 }}>
        Consultas recientes
      </Text>
      {recentConsultations.length === 0 ? (
        <Card>
          <Text style={{ color: colors.inkMuted, textAlign: 'center' }}>
            Sin consultas previas. Cuando atiendas a {pet.name} por videollamada, aparecerá acá.
          </Text>
        </Card>
      ) : (
        recentConsultations.map((c: { id: string; reason: string; status: string; completedAt: string | null; joinedAt: string; createdAt: string }) => (
          <Card key={c.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 }}>
                {c.reason}
              </Text>
              <Badge
                label={statusLabel[c.status] ?? c.status}
                bg={statusColors[c.status] ?? colors.primary}
              />
            </View>
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              {formatDateTime(c.completedAt ?? c.joinedAt ?? c.createdAt)}
            </Text>
          </Card>
        ))
      )}

      {/* Quick CTA */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/(app)/chat')}>
          💬 Preguntar a la IA
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/(app)/queue', params: { petId: pet.id } })}
        >
          ⏳ Pedir videollamada
        </Button>
      </View>
    </ScrollView>
  );
}
