import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge, SkeletonCard, EmptyState, Modal, Button } from '@/components/ui';
import { RatingStars } from '@/components/RatingStars';
import { useConsultationHistory, useRateConsultation } from '@/hooks/useConsultations';
import { useTheme, spacing, fontSizes, fontWeights, radius, speciesIcon, speciesLabel } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { Consultation } from '@/types';

type Grouped = { pet: Consultation['pet']; consultations: Consultation[] };
type RatingTarget = { consultationId: string; vetName: string } | null;

export const options = { title: "Historial clínico" };

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { data, isFetching, refetch, isLoading, isError, error } = useConsultationHistory({ limit: 50 });
  const consultations = data ?? [];
  const [ratingTarget, setRatingTarget] = useState<RatingTarget>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const rate = useRateConsultation();
  const commentValid = comment.trim().length >= 10;
  const canSubmit = rating > 0 && commentValid && !rate.isPending;

  const grouped: Grouped[] = useMemo(
    () => Object.values(
      consultations.reduce<Record<string, Grouped>>((acc, item) => {
        const petId = item.pet?.id || 'unknown';
        if (!acc[petId]) acc[petId] = { pet: item.pet, consultations: [] };
        acc[petId].consultations.push(item);
        return acc;
      }, {})
    ),
    [consultations]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          subtitle={(error as any)?.message ?? 'No pudimos cargar el historial. Revisá tu conexión.'}
          ctaLabel="Reintentar"
          onCta={() => refetch()}
        />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.pet?.id || 'unknown'}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.primary} />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-outline"
            title="Sin historial médico"
            subtitle="Cuando un veterinario finalice una consulta, aparecerá acá con el diagnóstico y las notas."
          />
        }
        renderItem={({ item: group }) => {
          const pet = group.pet;
          const petName = pet?.name || 'Mascota';
          const petSpecies = pet?.species || 'desconocida';
          const iconName = (speciesIcon[petSpecies] || 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
          const completedCount = group.consultations.filter(c => c.status === 'COMPLETED').length;

          return (
            <View style={{ marginBottom: spacing.xxl }}>
              {/* Pet header */}
              <Pressable
                onPress={() => pet?.id && router.push(`/(app)/pets/${pet.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={iconName} size={22} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink }}>{petName}</Text>
                  <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>{completedCount} consultas completadas · {group.consultations.length} total</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={c.inkMuted} />
              </Pressable>

              {/* Timeline */}
              {group.consultations.map((item, idx) => {
                const st = item.status;
                const isCompleted = st === 'COMPLETED';
                const isActive = st === 'ACTIVE';
                const isWaiting = st === 'WAITING';
                const isLast = idx === group.consultations.length - 1;
                const iconName = isCompleted ? 'check-circle-outline' : isActive ? 'chat-processing-outline' : isWaiting ? 'clock-outline' : 'close-circle-outline';
                const iconColor = isCompleted ? c.success : isActive ? c.primary : isWaiting ? c.accent : c.danger;
                const badgeLabel = isCompleted ? 'Completada' : isActive ? 'En curso' : isWaiting ? 'En espera' : 'Cancelada';
                const badgeBg = isCompleted ? c.successBg : isActive ? c.primaryBg : isWaiting ? c.accentBg : c.dangerBg;
                const badgeColor = isCompleted ? c.successDark : isActive ? c.primary : isWaiting ? c.accent : c.dangerDark;
                const vetName = item.vet?.firstName || item.vet?.email || 'Veterinario';

                return (
                  <View key={item.id} style={{ flexDirection: 'row', marginBottom: isLast ? 0 : spacing.lg }}>
                    {/* Timeline column */}
                    <View style={{ width: 28, alignItems: 'center' }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: iconColor + '18', justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={iconName} size={11} color={iconColor} />
                      </View>
                      {!isLast && <View style={{ flex: 1, width: 2, backgroundColor: c.borderLight, marginTop: 2 }} />}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, marginLeft: spacing.sm, marginTop: -1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <View style={{ flex: 1, marginRight: spacing.sm }}>
                          <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink, lineHeight: 20 }} numberOfLines={1}>{vetName}</Text>
                        </View>
                        <Badge label={badgeLabel} bg={badgeBg} color={badgeColor} size="sm" />
                      </View>
                      <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, marginBottom: spacing.sm }}>
                        {formatDateTime(item.endedAt ?? item.createdAt)}
                      </Text>
                      {item.notes ? (
                        <View style={{ backgroundColor: c.primaryBg, borderRadius: radius.lg, padding: spacing.md }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                            <MaterialCommunityIcons name="note-text-outline" size={14} color={c.primary} />
                            <Text style={{ fontSize: fontSizes.caption, color: c.primary, fontWeight: fontWeights.semibold }}>
                              Notas del veterinario
                            </Text>
                          </View>
                          <Text style={{ fontSize: fontSizes.body, color: c.ink, lineHeight: 20 }}>
                            {item.notes}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: fontSizes.caption, color: c.inkSoft, fontStyle: 'italic' }}>
                          Sin notas registradas
                        </Text>
                      )}
                      {isCompleted && item.review && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
                          <RatingStars value={item.review.rating} size={14} disabled />
                          <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, flex: 1 }}>
                            {item.review.comment || 'Calificaste esta consulta'}
                          </Text>
                        </View>
                      )}
                      {isCompleted && !item.review && (
                        <Pressable
                          onPress={() => {
                            setRating(0);
                            setComment('');
                            setRatingTarget({ consultationId: item.id, vetName });
                          }}
                          style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                          accessibilityRole="button"
                          accessibilityLabel={`Calificar consulta con ${vetName}`}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: c.accentBg, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                            <MaterialCommunityIcons name="star-outline" size={16} color={c.accentDark} />
                            <Text style={{ fontSize: fontSizes.caption, color: c.accentDark, fontWeight: fontWeights.semibold }}>
                              Calificar consulta
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        }}
      />
      <Modal
        visible={ratingTarget !== null}
        title={`Calificá a ${ratingTarget?.vetName ?? ''}`}
        onClose={() => setRatingTarget(null)}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setRatingTarget(null)}
              style={{ flex: 1 }}
              accessibilityLabel="Cancelar calificación"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={rate.isPending}
              disabled={!canSubmit}
              onPress={() => {
                if (!ratingTarget || !canSubmit) return;
                rate.mutate(
                  { consultationId: ratingTarget.consultationId, payload: { rating, comment: comment.trim() } },
                  {
                    onSuccess: () => {
                      setRatingTarget(null);
                      setRating(0);
                      setComment('');
                    },
                  }
                );
              }}
              style={{ flex: 1 }}
              accessibilityLabel="Enviar calificación"
            >
              Enviar
            </Button>
          </>
        }
      >
        <View style={{ gap: spacing.lg }}>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, textAlign: 'center' }}>
            ¿Cómo fue la atención de esta consulta?
          </Text>
          <RatingStars value={rating} onChange={setRating} size={28} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="¿Por qué le das esa calificación? (obligatorio, mín. 10 caracteres)"
            placeholderTextColor={c.inkMuted}
            multiline
            maxLength={500}
            style={{
              backgroundColor: c.surface,
              borderRadius: radius.lg,
              borderWidth: 1.5,
              borderColor: comment.length > 0 && !commentValid ? c.danger : c.border,
              padding: spacing.md,
              minHeight: 90,
              fontSize: fontSizes.body,
              color: c.ink,
              textAlignVertical: 'top',
            }}
            accessibilityLabel="Comentario sobre la consulta"
          />
          {comment.length > 0 && !commentValid && (
            <Text style={{ fontSize: fontSizes.label, color: c.danger, textAlign: 'center' }}>
              Tu opinión debe tener al menos 10 caracteres ({comment.trim().length}/10).
            </Text>
          )}
          {rate.isError && (
            <Text style={{ fontSize: fontSizes.label, color: c.danger, textAlign: 'center' }}>
              {(rate.error as any)?.message ?? 'No pudimos guardar tu calificación. Intentá de nuevo.'}
            </Text>
          )}
        </View>
      </Modal>
    </Animated.View>
  );
}
