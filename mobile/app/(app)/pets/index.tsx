import { View, FlatList, RefreshControl } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { PetCard } from '@/components/PetCard';
import { Button, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing } from '@/theme';

export default function PetsListScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const pets = list.data ?? [];

  if (list.isLoading) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState icon="paw" title="Aún no tenés mascotas" subtitle="Cargá tu primera mascota para empezar a usar VetConnect." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} tintColor={c.primary} />}
        renderItem={({ item }) => <PetCard pet={item} onPress={() => router.push(`/(app)/pets/${item.id}`)} />}
        ListHeaderComponent={
          <Button onPress={() => router.push('/(app)/pets/new')} size="md" fullWidth style={{ marginBottom: spacing.md }} icon={<MaterialCommunityIcons name="plus" size={18} color={c.white} />}>
            Agregar mascota
          </Button>
        }
      />
    </Animated.View>
  );
}
