import { useCallback } from 'react';
import { View, FlatList, RefreshControl, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { PetCard } from '@/components/PetCard';
import { Button, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing } from '@/theme';

export default function PetsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const pets = list.data ?? [];

  const handlePress = useCallback(
    (id: string) => router.push(`/(app)/pets/${id}`),
    [router]
  );

  if (list.isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, padding: spacing.lg, gap: spacing.md }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (list.isError) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          subtitle="No pudimos cargar tus mascotas. Revisá tu conexión e intentá de nuevo."
          ctaLabel="Reintentar"
          onCta={() => list.refetch()}
        />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState
          icon="paw"
          title="Aún no tenés mascotas"
          subtitle="Cargá tu primera mascota para empezar a usar VetConnect."
          ctaLabel="Agregar mascota"
          onCta={() => router.push('/(app)/pets/new')}
        />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} tintColor={c.primary} />}
        renderItem={({ item }) => <PetCard pet={item} onPress={() => handlePress(item.id)} />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Button onPress={() => router.push('/(app)/pets/new')} size="md" fullWidth icon={<MaterialCommunityIcons name="plus" size={18} color={c.white} />}>
              Agregar mascota
            </Button>
          </View>
        }
      />
    </Animated.View>
  );
}
