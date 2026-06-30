import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useConsultationHistory, useRateConsultation } from '@/hooks/useConsultations';
import { colors, statusColors, statusLabel } from '@/theme';
import { formatDateTime, formatDuration, truncate } from '@/utils/format';
import { ApiError, type Consultation } from '@/types';
import Toast from 'react-native-toast-message';

export default function HistoryScreen() {
  const { data, isFetching, refetch, isLoading } = useConsultationHistory({ limit: 50 });
  const rateMutation = useRateConsultation();
  const [ratingTarget, setRatingTarget] = useState<Consultation | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const consultations = data ?? [];

  const openRating = (c: Consultation) => {
    setRatingTarget(c);
    setRating(0);
    setComment('');
  };

  const submitRating = async () => {
    if (!ratingTarget || rating < 1) return;
    try {
      await rateMutation.mutateAsync({
        entryId: ratingTarget.id,
        payload: { rating, comment: comment.trim() || undefined },
      });
      Toast.show({ type: 'success', text1: '¡Gracias por tu valoración!' });
      setRatingTarget(null);
      refetch();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar la valoración.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    }
  };

  if (isLoading) {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={consultations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            emoji="📋"
            title="Sin consultas previas"
            subtitle="Cuando pidas una videollamada y la finalices, aparecerá acá con el diagnóstico, tratamiento y resumen."
          />
        }
        renderItem={({ item }) => {
          const canRate =
            item.status === 'COMPLETED' &&
            item.completedAt &&
            Date.now() - new Date(item.completedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 }}>
                  {item.petName ?? 'Mascota'} · {truncate(item.reason, 50)}
                </Text>
                <Badge
                  label={statusLabel[item.status] ?? item.status}
                  bg={statusColors[item.status] ?? colors.primary}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.inkMuted, marginBottom: 4 }}>
                {formatDateTime(item.completedAt ?? item.consultationStartedAt ?? item.joinedAt)}
                {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ''}
              </Text>
              {item.diagnosis && (
                <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
                  🩺 Diagnóstico: {item.diagnosis}
                </Text>
              )}
              {item.treatment && (
                <Text style={{ fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>
                  💊 Tratamiento: {item.treatment}
                </Text>
              )}
              {item.consultationSummary && (
                <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.inkMuted, marginBottom: 2 }}>
                    📝 Resumen IA
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.ink, lineHeight: 18 }}>
                    {item.consultationSummary}
                  </Text>
                </View>
              )}
              {canRate && (
                <Button size="sm" variant="outline" style={{ marginTop: 10 }} onPress={() => openRating(item)}>
                  ⭐ Valorar consulta
                </Button>
              )}
            </Card>
          );
        }}
      />

      <Modal
        visible={ratingTarget !== null}
        title="Valorar consulta"
        onClose={() => setRatingTarget(null)}
        footer={
          <>
            <Button variant="ghost" size="sm" onPress={() => setRatingTarget(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onPress={submitRating}
              loading={rateMutation.isPending}
              disabled={rating < 1}
            >
              Enviar
            </Button>
          </>
        }
      >
        <Text style={{ fontSize: 14, color: colors.ink, marginBottom: 12 }}>
          ¿Cómo fue tu experiencia con esta consulta?
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)}>
              <Text style={{ fontSize: 32, color: n <= rating ? colors.accent : colors.border }}>
                ★
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          label="Comentario (opcional)"
          placeholder="Contanos cómo fue la atención…"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />
      </Modal>
    </View>
  );
}
