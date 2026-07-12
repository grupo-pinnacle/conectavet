import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge, SkeletonCard, EmptyState, Modal, Button, Input } from '@/components/ui';
import { useConsultationHistory, useRateConsultation } from '@/hooks/useConsultations';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { formatDateTime, formatDuration } from '@/utils/format';
import { ApiError, type Consultation } from '@/types';
import Toast from 'react-native-toast-message';

export default function HistoryScreen() {
  const { colors: c } = useTheme();
  const { data, isFetching, refetch, isLoading } = useConsultationHistory({ limit: 50 });
  const rateMutation = useRateConsultation();
  const [ratingTarget, setRatingTarget] = useState<Consultation | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const consultations = data ?? [];

  const openRating = (consult: Consultation) => { setRatingTarget(consult); setRating(0); setComment(''); };
  const submitRating = async () => {
    if (!ratingTarget || rating < 1) return;
    try {
      await rateMutation.mutateAsync({ entryId: ratingTarget.id, payload: { rating, comment: comment.trim() || undefined } });
      Toast.show({ type: 'success', text1: 'Gracias por tu valoración', text2: 'Tu opinión nos ayuda a mejorar.' });
      setRatingTarget(null);
      refetch();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar la valoración.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    }
  };

  if (isLoading) {
    return <View style={{ padding: spacing.lg, gap: spacing.md }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={consultations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.primary} />}
        ListEmptyComponent={<EmptyState icon="clipboard-text-outline" title="Sin consultas previas" subtitle="Cuando pidas una videollamada y la finalices, aparecerá acá con el diagnóstico, tratamiento y resumen." />}
        renderItem={({ item }) => {
          const canRate = item.status === 'COMPLETED' && item.completedAt && Date.now() - new Date(item.completedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
          const statusIcon = item.status === 'COMPLETED' ? 'check-circle' : item.status === 'CANCELLED' ? 'close-circle' : item.status === 'IN_CONSULTATION' ? 'progress-check' : 'clock-outline';
          const statusIconColor = item.status === 'COMPLETED' ? c.success : item.status === 'CANCELLED' ? c.danger : item.status === 'IN_CONSULTATION' ? c.primary : c.accent;
          return (
            <Card padding={spacing.lg}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <MaterialCommunityIcons name={statusIcon} size={20} color={statusIconColor} />
                  <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink, flex: 1 }}>
                    {item.petName ?? 'Mascota'} · {item.reason.length > 50 ? item.reason.slice(0, 50) + '…' : item.reason}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: spacing.xxxl }}>
                <Badge label={item.status === 'COMPLETED' ? 'Completada' : item.status === 'CANCELLED' ? 'Cancelada' : item.status === 'IN_CONSULTATION' ? 'En curso' : item.status === 'WAITING' ? 'En espera' : 'Asignado'} bg={item.status === 'COMPLETED' ? c.successBg : item.status === 'CANCELLED' ? c.dangerBg : c.primaryBg} color={item.status === 'COMPLETED' ? c.successDark : item.status === 'CANCELLED' ? c.dangerDark : c.primary} size="sm" />
                <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>
                  {formatDateTime(item.completedAt ?? item.consultationStartedAt ?? item.joinedAt)}
                  {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ''}
                </Text>
              </View>
              {item.diagnosis && <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, marginTop: spacing.md }}>Diagnóstico: {item.diagnosis}</Text>}
              {item.treatment && <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, marginTop: spacing.xs }}>Tratamiento: {item.treatment}</Text>}
              {item.consultationSummary && (
                <View style={{ backgroundColor: c.primaryBg, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                    <MaterialCommunityIcons name="note-text" size={16} color={c.primary} />
                    <Text style={{ fontSize: fontSizes.label, color: c.primary, fontWeight: fontWeights.semibold }}>Resumen de la consulta</Text>
                  </View>
                  <Text style={{ fontSize: fontSizes.body, color: c.ink, lineHeight: 20 }}>{item.consultationSummary}</Text>
                </View>
              )}
              {canRate && (
                <Button size="sm" variant="secondary" style={{ marginTop: spacing.md }} onPress={() => openRating(item)}                   icon={<MaterialCommunityIcons name="star-outline" size={16} color={c.white} />}>
                  Valorar consulta
                </Button>
              )}
            </Card>
          );
        }}
      />

      <Modal visible={ratingTarget !== null} title="Valorar consulta" onClose={() => setRatingTarget(null)}
        footer={
          <>
            <Button variant="ghost" size="sm" onPress={() => setRatingTarget(null)}>Cancelar</Button>
            <Button size="sm" onPress={submitRating} loading={rateMutation.isPending} disabled={rating < 1}>Enviar</Button>
          </>
        }
      >
        <Text style={{ fontSize: fontSizes.body, color: c.ink, marginBottom: spacing.lg }}>¿Cómo fue tu experiencia con esta consulta?</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} estrella${n > 1 ? 's' : ''}`} accessibilityState={{ selected: n <= rating }}>
              <MaterialCommunityIcons name={n <= rating ? 'star' : 'star-outline'} size={36} color={n <= rating ? c.accent : c.border} />
            </Pressable>
          ))}
        </View>
        <Input label="Comentario (opcional)" placeholder="Contanos cómo fue la atención…" value={comment} onChangeText={setComment} multiline numberOfLines={3} leftIcon="message-text-outline" />
      </Modal>
    </View>
  );
}
