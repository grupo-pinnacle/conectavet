import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/ui';
import { useConsultationHistory } from '@/hooks/useConsultations';
import { useTheme, spacing, fontSizes, fontWeights, radius, speciesIcon, speciesLabel } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { Consultation } from '@/types';

type Grouped = { pet: Consultation['pet']; consultations: Consultation[] };

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { data, isFetching, refetch, isLoading, isError, error } = useConsultationHistory({ limit: 50 });
  const consultations = data ?? [];

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
                    </View>
                  </View>
                );
              })}
            </View>
          );
        }}
      />
    </Animated.View>
  );
}
