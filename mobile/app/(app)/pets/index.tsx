import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { usePets } from '@/hooks/usePets';
import { PetCard } from '@/components/PetCard';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PetsListScreen() {
  const router = useRouter();
  const { list } = usePets();
  const pets = list.data ?? [];

  if (list.isLoading) {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <EmptyState
          emoji="🐾"
          title="Aún no tenés mascotas"
          subtitle="Cargá tu primera mascota para empezar a usar VetConnect."
          ctaLabel="Agregar mascota"
          onCta={() => router.push('/(app)/pets/new')}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} />}
      renderItem={({ item }) => (
        <PetCard pet={item} onPress={() => router.push(`/(app)/pets/${item.id}`)} />
      )}
      ListHeaderComponent={
        <Button onPress={() => router.push('/(app)/pets/new')} style={{ marginBottom: 12 }}>
          + Agregar mascota
        </Button>
      }
    />
  );
}
