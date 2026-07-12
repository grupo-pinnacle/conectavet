import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConsultationHistory } from '@/hooks/useConsultations';
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing, fontSizes, fontWeights } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { Consultation } from '@/types';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { data, isFetching, refetch, isLoading } = useConsultationHistory({ limit: 50 });
  const consultations = (data ?? []).filter(
    (c: Consultation) => c.status !== 'WAITING'
  );

  if (isLoading) {
    return <View style={{ padding: spacing.lg, gap: spacing.md }}><SkeletonCard /><SkeletonCard /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={consultations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.primary} />}
        ListEmptyComponent={
          <EmptyState icon="chat-processing" title="Sin consultas activas" subtitle="Cuando solicites una consulta y un veterinario la atienda, podrás chatear aquí." ctaLabel="Solicitar consulta" onCta={() => router.push('/(app)/queue')} />
        }
        renderItem={({ item }) => {
          const statusIcon = item.status === 'COMPLETED' ? 'check-circle' : item.status === 'CANCELLED' ? 'close-circle' : item.status === 'IN_CONSULTATION' ? 'progress-check' : 'chat-processing';
          const statusIconColor = item.status === 'COMPLETED' ? c.success : item.status === 'CANCELLED' ? c.danger : item.status === 'IN_CONSULTATION' ? c.primary : c.accent;
          const statusLabel = item.status === 'COMPLETED' ? 'Completada' : item.status === 'CANCELLED' ? 'Cancelada' : item.status === 'IN_CONSULTATION' ? 'En curso' : 'Asignado';
          return (
            <Pressable onPress={() => router.push(`/(app)/chat/${item.id}`)} accessibilityRole="button" accessibilityLabel={`Chat con ${item.vetName ?? 'veterinario'}`} accessibilityHint="Abrir chat de la consulta">
              <Card padding={spacing.lg}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    <MaterialCommunityIcons name={statusIcon} size={20} color={statusIconColor} />
                    <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink, flex: 1 }} numberOfLines={1}>
                      {item.vetName ?? 'Veterinario'} · {item.petName ?? 'Mascota'}
                    </Text>
                  </View>
                  <Badge label={statusLabel} size="sm" bg={item.status === 'COMPLETED' ? c.successBg : item.status === 'CANCELLED' ? c.dangerBg : c.primaryBg} color={item.status === 'COMPLETED' ? c.successDark : item.status === 'CANCELLED' ? c.dangerDark : c.primary} />
                </View>
                <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginLeft: spacing.xxxl }} numberOfLines={1}>{item.reason}</Text>
                <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, marginLeft: spacing.xxxl, marginTop: spacing.xs }}>{formatDateTime(item.updatedAt)}</Text>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
