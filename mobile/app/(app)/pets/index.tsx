import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Platform, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { PetCard } from '@/components/PetCard';
import { Button, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing, fontSizes, fontWeights, radius } from '@/theme';
import type { Pet } from '@/types';
import HistoryScreen from '../history';

type Section = 'pets' | 'history';

export default function PetsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const pets = list.data ?? [];
  const params = useLocalSearchParams<{ tab?: string }>();
  const [view, setView] = useState<Section>(params.tab === 'history' ? 'history' : 'pets');

  const handlePress = useCallback(
    (pet: Pet) => router.push(`/(app)/pets/${pet.id}`),
    [router]
  );

  const Segmented = (
    <View style={{ flexDirection: 'row', gap: spacing.xs, backgroundColor: c.borderLight, borderRadius: radius.full, padding: 4 }}>
      {([
        { key: 'pets' as const, label: 'Mascotas', icon: 'paw' as const },
        { key: 'history' as const, label: 'Historial', icon: 'clipboard-text-outline' as const },
      ]).map((tab) => {
        const active = view === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setView(tab.key)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: active ? c.surface : 'transparent',
              shadowColor: active ? '#000' : undefined,
              shadowOpacity: active ? 0.06 : 0,
              shadowRadius: active ? 4 : 0,
              shadowOffset: active ? { width: 0, height: 1 } : undefined,
              elevation: active ? 2 : 0,
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <MaterialCommunityIcons name={tab.icon} size={16} color={active ? c.primary : c.inkMuted} />
            <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.bold, color: active ? c.primary : c.inkMuted }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (list.isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, padding: spacing.lg, gap: spacing.md }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>{Segmented}</View>
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

  if (view === 'history') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>{Segmented}</View>
        <HistoryScreen />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>{Segmented}</View>
        <View style={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' }}>
          <EmptyState
            icon="paw"
            title="Aún no tenés mascotas"
            subtitle="Cargá tu primera mascota para empezar a usar VetConnect."
            ctaLabel="Agregar mascota"
            onCta={() => router.push('/(app)/pets/new')}
          />
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: c.background }} entering={FadeIn.duration(300)}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>{Segmented}</View>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={list.refetch} tintColor={c.primary} />}
        renderItem={({ item }) => <PetCard pet={item} onPress={handlePress} />}
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
