import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConversations } from '@/hooks/useChat';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function ChatListScreen() {
  const router = useRouter();
  const { list, create } = useConversations();
  const conversations = list.data ?? [];

  const onCreate = async () => {
    try {
      const conv = await create.mutateAsync({});
      router.push(`/(app)/chat/${conv.id}`);
    } catch {
      // toast handled globally
    }
  };

  if (list.isLoading) {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} />}
        ListHeaderComponent={
          <Button onPress={onCreate} loading={create.isPending} style={{ marginBottom: 12 }}>
            + Nueva conversación
          </Button>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💬"
            title="No tenés conversaciones"
            subtitle="Iniciá una nueva charla con el asistente IA veterinario para resolver dudas no urgentes."
            ctaLabel="Iniciar conversación"
            onCta={onCreate}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/chat/${item.id}`)}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 }}>
                  {item.title ?? 'Conversación sin título'}
                </Text>
                {item.status === 'ESCALATED' && (
                  <Badge label="🚨 Emergencia" bg={colors.danger} />
                )}
                {item.status === 'ARCHIVED' && <Badge label="Archivada" bg={colors.inkMuted} />}
              </View>
              <Text style={{ fontSize: 12, color: colors.inkMuted }}>
                {formatDateTime(item.updatedAt)}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
