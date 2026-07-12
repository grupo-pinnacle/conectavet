import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConversations } from '@/hooks/useChat';
import { Card, Badge, SkeletonCard, EmptyState, Button } from '@/components/ui';
import { useTheme, spacing, fontSizes, fontWeights } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { list, create } = useConversations();
  const conversations = list.data ?? [];

  const onCreate = async () => {
    try {
      const conv = await create.mutateAsync({});
      router.push(`/(app)/chat/${conv.id}`);
    } catch {}
  };

  if (list.isLoading) {
    return <View style={{ padding: spacing.lg, gap: spacing.md }}><SkeletonCard /><SkeletonCard /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} tintColor={c.primary} />}
        ListHeaderComponent={
          <Button onPress={onCreate} loading={create.isPending} size="md" fullWidth style={{ marginBottom: spacing.md }} icon={<MaterialCommunityIcons name="plus" size={18} color={c.white} />}>
            Nueva conversación
          </Button>
        }
        ListEmptyComponent={
          <EmptyState icon="chat-processing" title="No tenés conversaciones" subtitle="Iniciá una nueva charla con el asistente IA veterinario para resolver dudas no urgentes." ctaLabel="Iniciar conversación" onCta={onCreate} />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/chat/${item.id}`)} accessibilityRole="button" accessibilityLabel={item.title ?? 'Conversación'} accessibilityHint="Abrir conversación">
            <Card padding={spacing.lg}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <MaterialCommunityIcons name={item.status === 'ESCALATED' ? 'alert-circle' : 'chat-processing'} size={20} color={item.status === 'ESCALATED' ? c.danger : c.primary} />
                  <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink, flex: 1 }}>{item.title ?? 'Conversación sin título'}</Text>
                </View>
                {item.status === 'ESCALATED' && <Badge label="Emergencia" bg={c.danger} color={c.white} size="sm" icon="alert" />}
                {item.status === 'ARCHIVED' && <Badge label="Archivada" bg={c.inkMuted} color={c.white} size="sm" />}
              </View>
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, marginLeft: spacing.xxxl }}>{formatDateTime(item.updatedAt)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
