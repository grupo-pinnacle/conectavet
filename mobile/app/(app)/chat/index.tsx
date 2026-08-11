import { FlatList, Pressable, RefreshControl, Text, View, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConsultationHistory } from '@/hooks/useConsultations';
import { Badge, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing, fontSizes, fontWeights, radius } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { Consultation } from '@/types';

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { data, isFetching, refetch, isLoading, isError, error } = useConsultationHistory({ limit: 50 });
  const consultations = (data ?? []).filter(
    (c: Consultation) => c.status !== 'WAITING'
  );

  const activeConsultations = consultations.filter(c => c.status === 'ACTIVE' || c.status === 'PENDING');
  const pastConsultations = consultations.filter(c => c.status !== 'ACTIVE' && c.status !== 'PENDING');

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
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
          subtitle={(error as any)?.message ?? 'No pudimos cargar tus consultas. Revisá tu conexión.'}
          ctaLabel="Reintentar"
          onCta={() => refetch()}
        />
      </View>
    );
  }

  const allSections: { type: 'active' | 'past'; data: Consultation[] }[] = [
    ...(activeConsultations.length > 0 ? [{ type: 'active' as const, data: activeConsultations }] : []),
    ...(pastConsultations.length > 0 ? [{ type: 'past' as const, data: pastConsultations }] : []),
  ];

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      <FlatList
        data={allSections}
        keyExtractor={(item) => item.type}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.primary} />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <EmptyState
            icon="chat-processing"
            title="Sin consultas activas"
            subtitle="Cuando solicites una consulta y un veterinario la atienda, podrás chatear aquí."
            ctaLabel="Solicitar consulta"
            onCta={() => router.push('/(app)/queue')}
          />
        }
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: spacing.xxl }}>
            {section.type === 'past' && activeConsultations.length > 0 && (
              <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.semibold, color: c.inkMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: spacing.xs }}>
                Anteriores
              </Text>
            )}
            <View style={{ gap: spacing.sm }}>
              {section.data.map((item: Consultation) => {
                const isActive = item.status === 'ACTIVE';
                const isPending = item.status === 'PENDING';
                const isCompleted = item.status === 'COMPLETED';
                const iconName = isActive ? 'chat-processing' : isPending ? 'clock-outline' : isCompleted ? 'check-circle-outline' : 'close-circle-outline';
                const iconColor = isActive ? c.primary : isPending ? c.accentDark : isCompleted ? c.success : c.inkMuted;
                const label = isActive ? 'En curso' : isPending ? 'Por confirmar' : isCompleted ? 'Completada' : 'Cancelada';
                const bgColor = isActive ? c.primaryBg : isPending ? c.accentBg : isCompleted ? c.successBg : c.dangerBg;
                const textColor = isActive ? c.primary : isPending ? c.accentDark : isCompleted ? c.successDark : c.dangerDark;
                const petDisplay = item.pet?.name || 'Mascota';
                const vetDisplay = item.vet?.firstName || item.vet?.email;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/(app)/chat/${item.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Chat${vetDisplay ? ` con ${vetDisplay}` : ''}, ${petDisplay}`}
                    style={{ opacity: isActive || isPending ? 1 : 0.7 }}
                  >
                    <View style={{
                      flexDirection: 'row', borderRadius: radius.xl,
                      backgroundColor: c.surface, overflow: 'hidden',
                      ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isActive ? 0.08 : 0.04, shadowRadius: 6 },
                        android: { elevation: isActive ? 3 : 1 },
                      }),
                    }}>
                      {/* Active / pending consultations get a colored left border */}
                      {(isActive || isPending) && (
                        <View style={{ width: 4, backgroundColor: isActive ? c.primary : c.accent, borderTopLeftRadius: radius.xl, borderBottomLeftRadius: radius.xl }} />
                      )}
                      <View style={{ flex: 1, padding: spacing.lg, paddingLeft: isActive || isPending ? spacing.md : spacing.lg }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                            {/* Avatar circle */}
                            <View style={{
                              width: 40, height: 40, borderRadius: 20,
                              backgroundColor: isActive ? c.primaryBg : isPending ? c.accentBg : c.borderLight,
                              justifyContent: 'center', alignItems: 'center',
                            }}>
                              <MaterialCommunityIcons
                                name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                                size={20} color={iconColor}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink }} numberOfLines={1}>
                                {petDisplay}
                              </Text>
                              {vetDisplay ? (
                                <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, marginTop: 1 }} numberOfLines={1}>
                                  con {vetDisplay}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <Badge label={label} size="sm" bg={bgColor} color={textColor} />
                        </View>
                        <Text style={{ fontSize: fontSizes.caption, color: c.inkSoft, marginTop: spacing.sm, marginLeft: 52 }}>
                          {formatDateTime(item.updatedAt ?? item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </Animated.View>
  );
}
