import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVets } from '@/hooks/useVets';
import { useFavorites } from '@/hooks/useFavorites';
import { Input, SkeletonCard, EmptyState } from '@/components/ui';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { Vet } from '@/types';

export default function VetPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { colors: c } = useTheme();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating' | 'recent'>('rating');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: vets, isLoading, isError, refetch } = useVets({
    search: debounced || undefined,
    online: onlineOnly || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    sortBy,
  });
  const { toggle } = useFavorites();

  const visible = useMemo(() => {
    const all = vets ?? [];
    const rated = minRating > 0 ? all.filter((v) => (v.ratingAvg ?? 0) >= minRating) : all;
    return favoritesOnly ? rated.filter((v) => v.isFavorite) : rated;
  }, [vets, favoritesOnly, minRating]);

  const onSelect = useCallback(
    (vet: Vet) => {
      qc.setQueryData(['queue', 'selectedVet'], vet);
      // Si llegamos desde "Nueva consulta", volvemos con el vet elegido.
      // Si entramos directo a la pestaña Veterinarios, vamos a Consultas
      // para arrancar la consulta con ese veterinario (nunca al inicio).
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(app)/queue');
      }
    },
    [qc, router]
  );

  const onToggleFavorite = useCallback(
    (vet: Vet) => {
      toggle.mutate({ vetId: vet.id, favorited: Boolean(vet.isFavorite) });
    },
    [toggle]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.ink} />
          </Pressable>
        )}
        <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, flex: 1 }}>
          Elegir veterinario
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, email o especialidad…"
          leftIcon="magnify"
          accessibilityLabel="Buscar veterinarios"
          containerStyle={{ marginBottom: spacing.sm }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.medium }}>Solo disponibles</Text>
          <Switch
            value={onlineOnly}
            onValueChange={setOnlineOnly}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.white}
            accessibilityLabel="Filtrar solo veterinarios disponibles"
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.medium }}>Solo favoritos</Text>
          <Switch
            value={favoritesOnly}
            onValueChange={setFavoritesOnly}
            trackColor={{ false: c.border, true: c.accentDark }}
            thumbColor={c.white}
            accessibilityLabel="Filtrar solo veterinarios favoritos"
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.medium }}>Calificación</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginLeft: 'auto' }}>
            {[0, 4, 4.5].map((r) => {
              const selected = minRating === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setMinRating(r)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: selected ? c.primary : c.border,
                    backgroundColor: selected ? c.primaryBg : c.surface,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={r === 0 ? 'Todas las calificaciones' : `Solo ${r} o más`}
                  accessibilityState={{ selected }}
                >
                  <Text style={{ fontSize: fontSizes.label, color: selected ? c.primary : c.inkMuted, fontWeight: fontWeights.medium }}>
                    {r === 0 ? 'Todas' : `${r}+`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          onPress={() => setSortBy((s) => (s === 'rating' ? 'recent' : 'rating'))}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}
          accessibilityRole="button"
          accessibilityLabel={sortBy === 'rating' ? 'Ordenar por más recientes' : 'Ordenar por calificación'}
          accessibilityHint="Alterna el orden de la lista de veterinarios"
        >
          <MaterialCommunityIcons name="sort-variant" size={18} color={c.primary} />
          <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.medium }}>
            Ordenar: {sortBy === 'rating' ? 'Mejor calificados' : 'Más recientes'}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Error al buscar"
            subtitle="No pudimos cargar los veterinarios. Revisá tu conexión."
            ctaLabel="Reintentar"
            onCta={() => refetch()}
          />
        </View>
      ) : visible.length === 0 ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          <EmptyState
            icon="account-search-outline"
            title="Sin resultados"
            subtitle={
              favoritesOnly
                ? 'Aún no guardaste veterinarios como favoritos. Tocá el corazón para guardarlos.'
                : debounced
                  ? 'No encontramos veterinarios con ese nombre.'
                  : 'Todavía no hay veterinarios disponibles.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Veterinario';
            const isFav = Boolean(item.isFavorite);
            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.xl,
                  borderWidth: 1.5,
                  borderColor: c.border,
                  backgroundColor: pressed ? c.borderLight : c.surface,
                  opacity: item.isOnline ? 1 : 0.8,
                })}
                accessibilityRole="button"
                accessibilityLabel={`Elegir a ${name}`}
                accessibilityHint={item.isOnline ? undefined : 'No está disponible ahora, pero puede aceptar tu consulta cuando se conecte'}
              >
                <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: item.isOnline ? c.primaryBg : c.borderLight, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="stethoscope" size={22} color={item.isOnline ? c.primary : c.inkMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink }} numberOfLines={1}>{name}</Text>
                  <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }} numberOfLines={1}>
                    {item.specialty || item.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
                    {typeof item.ratingAvg === 'number' && item.ratingCount ? (
                      <>
                        <MaterialCommunityIcons name="star" size={12} color={c.accent} />
                        <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>
                          {item.ratingAvg.toFixed(1)} ({item.ratingCount})
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: fontSizes.caption, color: c.inkSoft }}>Sin calificaciones</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => onToggleFavorite(item)}
                  hitSlop={10}
                  style={{ padding: spacing.xs }}
                  accessibilityRole="button"
                  accessibilityLabel={isFav ? `Quitar a ${name} de favoritos` : `Agregar a ${name} a favoritos`}
                  accessibilityState={{ selected: isFav }}
                >
                  <MaterialCommunityIcons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFav ? c.danger : c.inkMuted}
                  />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
