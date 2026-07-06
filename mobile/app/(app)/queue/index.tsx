import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QueueStatus } from '@/components/QueueStatus';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useQueue } from '@/hooks/useQueue';
import { usePets } from '@/hooks/usePets';
import { colors, speciesEmoji, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import { ApiError, type Pet } from '@/types';

export default function QueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { myEntry, join, cancel, isFetching } = useQueue();
  const { list } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(params.petId ?? null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pets = list.data ?? [];

  const onJoin = async () => {
    if (!selectedPetId) {
      Toast.show({ type: 'error', text1: 'Seleccioná una mascota' });
      return;
    }
    if (reason.trim().length < 5) {
      Toast.show({ type: 'error', text1: 'Describí el motivo (mín. 5 caracteres)' });
      return;
    }
    setSubmitting(true);
    try {
      await join.mutateAsync({ petId: selectedPetId, reason: reason.trim() });
      Toast.show({ type: 'success', text1: 'Te uniste a la cola ⏳' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo unir a la cola.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    try {
      await cancel.mutateAsync();
      Toast.show({ type: 'success', text1: 'Saliste de la cola' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo cancelar.';
      Toast.show({ type: 'error', text2: msg });
    }
  };

  if (isFetching && !myEntry) {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <SkeletonCard />
      </View>
    );
  }

  // Active entry view
  if (myEntry && myEntry.status !== 'COMPLETED' && myEntry.status !== 'CANCELLED') {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <QueueStatus
          entry={myEntry}
          onCancel={onCancel}
          isCancelling={cancel.isPending}
          onJoinCall={
            myEntry.livekitToken && myEntry.livekitRoomName
              ? () => router.push(`/(app)/call/${myEntry.id}`)
              : undefined
          }
        />
        <Card style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 13, color: colors.inkMuted }}>
            💡 Mantené la app abierta mientras esperás. Si perdés conexión, tenés 60
            segundos para reconectarte sin perder tu lugar en la cola.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  // Join form
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>
          Pedir videollamada 🎥
        </Text>
        <Text style={{ fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
          Te conectaremos con el primer veterinario disponible. La espera es FIFO (por
          orden de llegada).
        </Text>

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 8 }}>
          Seleccioná la mascota
        </Text>

        {list.isLoading ? (
          <SkeletonCard />
        ) : pets.length === 0 ? (
          <EmptyState
            emoji="🐾"
            title="Sin mascotas"
            subtitle="Agregá una mascota antes de pedir una videollamada."
            ctaLabel="Agregar mascota"
            onCta={() => router.push('/(app)/pets/new')}
          />
        ) : (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {pets.map((p: Pet) => {
              const selected = selectedPetId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPetId(p.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? `${colors.primary}10` : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{speciesEmoji[p.species]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.inkMuted }}>
                      {speciesLabel[p.species]} · {formatAge(p.birthDate)}
                    </Text>
                  </View>
                  {selected && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        )}

        <Input
          label="Motivo de consulta"
          placeholder="Ej: mi perro tiene vómitos desde ayer y está decaído."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80 }}
          hint="Mínimo 5 caracteres. Sé específico para que el veterinario pueda prepararse."
        />

        <Button
          onPress={onJoin}
          loading={submitting}
          disabled={pets.length === 0}
          size="lg"
          style={{ marginTop: 8 }}
        >
          Unirme a la cola
        </Button>
      </Card>
    </ScrollView>
  );
}
