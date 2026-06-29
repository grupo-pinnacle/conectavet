import { View, Text, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePets } from '@/hooks/usePets';
import { useQueue } from '@/hooks/useQueue';
import { useAuth } from '@/hooks/useAuth';
import { PetCard } from '@/components/PetCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, statusLabel } from '@/theme';
import type { Pet } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { list } = usePets();
  const { myEntry } = useQueue();

  const pets = list.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} />
      }
    >
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>
          ¡Hola, {user?.firstName}! 👋
        </Text>
        <Text style={{ fontSize: 14, color: colors.inkMuted }}>
          ¿Qué necesitás hacer hoy por tus mascotas?
        </Text>
      </Card>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/(app)/chat')}
        >
          <Card padding={14}>
            <Text style={{ fontSize: 28 }}>💬</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 6 }}>
              Preguntar a la IA
            </Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              Dudas no urgentes
            </Text>
          </Card>
        </Pressable>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/(app)/queue')}
        >
          <Card padding={14}>
            <Text style={{ fontSize: 28 }}>⏳</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 6 }}>
              Pedir videollamada
            </Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              Atención en vivo
            </Text>
          </Card>
        </Pressable>
      </View>

      {/* Active queue entry */}
      {myEntry && myEntry.status !== 'COMPLETED' && myEntry.status !== 'CANCELLED' && (
        <Pressable onPress={() => router.push('/(app)/queue')} style={{ marginTop: 12 }}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.inkMuted }}>
                  Consulta en curso
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 }}>
                  {myEntry.reason}
                </Text>
                <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>
                  Estado: {statusLabel[myEntry.status] ?? myEntry.status}
                </Text>
              </View>
              {myEntry.status === 'ASSIGNED' && myEntry.livekitToken && (
                <Button size="sm" onPress={() => router.push(`/(app)/call/${myEntry.id}`)}>
                  Unirme
                </Button>
              )}
            </View>
          </Card>
        </Pressable>
      )}

      {/* Pets */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>Tus mascotas</Text>
        <Pressable onPress={() => router.push('/(app)/pets/new')}>
          <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>+ Nueva</Text>
        </Pressable>
      </View>

      {list.isLoading ? (
        <View style={{ gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : pets.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🐾"
            title="Aún no tenés mascotas"
            subtitle="Cargá tu primera mascota para pedir consultas y chatear con la IA."
            ctaLabel="Agregar mascota"
            onCta={() => router.push('/(app)/pets/new')}
          />
        </Card>
      ) : (
        pets.map((pet: Pet) => (
          <PetCard key={pet.id} pet={pet} onPress={() => router.push(`/(app)/pets/${pet.id}`)} />
        ))
      )}
    </ScrollView>
  );
}
