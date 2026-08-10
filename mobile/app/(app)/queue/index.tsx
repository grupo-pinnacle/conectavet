import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, EmptyState, SkeletonCard } from '@/components/ui';
import { useCreateConsultation } from '@/hooks/useConsultations';
import { usePets } from '@/hooks/usePets';
import { useTheme, spacing, fontSizes, fontWeights, radius, speciesIcon, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import { ApiError, type Pet, type Vet } from '@/types';

export default function QueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const createConsultation = useCreateConsultation();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pets = list.data ?? [];

  const { data: selectedVet } = useQuery<Vet | undefined>({
    queryKey: ['queue', 'selectedVet'],
    queryFn: () => qc.getQueryData<Vet>(['queue', 'selectedVet']),
    initialData: () => qc.getQueryData<Vet>(['queue', 'selectedVet']),
  });

  const clearSelectedVet = () => {
    qc.removeQueries({ queryKey: ['queue', 'selectedVet'] });
  };

  const onSubmit = async () => {
    if (!selectedPetId) {
      Toast.show({ type: 'error', text1: 'Seleccioná una mascota' });
      return;
    }
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'Decinos brevemente qué le pasa', text2: '¿Cuál es el motivo de la consulta?' });
      return;
    }
    setSubmitting(true);
    try {
      const consultation = await createConsultation.mutateAsync({
        petId: selectedPetId,
        notes: reason.trim(),
        vetId: selectedVet?.id,
      });
      clearSelectedVet();
      router.replace(`/(app)/chat/${consultation.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos crear la consulta.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (list.isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
        <EmptyState icon="alert-circle-outline" title="Error al cargar" subtitle="No pudimos cargar tus mascotas." ctaLabel="Reintentar" onCta={() => list.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.huge }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, marginBottom: spacing.xxl }}>
        Nueva consulta
      </Text>

      {list.isLoading ? (
        <SkeletonCard />
      ) : pets.length === 0 ? (
        <EmptyState icon="paw" title="Sin mascotas" subtitle="Agregá una mascota antes de pedir una consulta." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
      ) : (
        <>
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink, marginBottom: spacing.md }}>Mascota</Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing.xxl }}>
            {pets.map((p: Pet) => {
              const selected = selectedPetId === p.id;
              const iconName = (speciesIcon[p.species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPetId(p.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primaryBg : c.surface }}
                  accessibilityRole="radio" accessibilityState={{ selected }}
                >
                  <MaterialCommunityIcons name={iconName} size={28} color={selected ? c.primary : c.inkSoft} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink }}>{p.name}</Text>
                    <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>{speciesLabel[p.species]} · {formatAge(p.birthDate)}</Text>
                  </View>
                  {selected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check" size={16} color={c.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink, marginBottom: spacing.sm }}>Motivo de la consulta</Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.md, lineHeight: 20 }}>
            Describí brevemente qué le pasa a tu mascota. Después podrás agregar más detalles en el chat.
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, marginBottom: spacing.xxl }}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Ej: vomita hace 2 días, no quiere comer…"
              placeholderTextColor={c.inkMuted}
              multiline
              maxLength={300}
              style={{ minHeight: 80, padding: spacing.lg, fontSize: fontSizes.input, color: c.ink, lineHeight: 20, textAlignVertical: 'top' }}
              accessibilityLabel="Motivo de la consulta"
              autoFocus
            />
          </View>

          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink, marginBottom: spacing.sm }}>Veterinario</Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.md, lineHeight: 20 }}>
            Elegí con quién querés hablar, o dejá que se asigne el primer disponible.
          </Text>
          {selectedVet ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, borderColor: c.primary, backgroundColor: c.primaryBg, marginBottom: spacing.xxl }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={22} color={c.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink }}>
                  {[selectedVet.firstName, selectedVet.lastName].filter(Boolean).join(' ')}
                </Text>
                <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>Elegido por vos</Text>
              </View>
              <Pressable
                onPress={() => { clearSelectedVet(); }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quitar veterinario elegido"
              >
                <MaterialCommunityIcons name="close-circle" size={22} color={c.inkMuted} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/(app)/vets')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.xl,
                borderWidth: 1.5,
                borderColor: c.border,
                backgroundColor: pressed ? c.borderLight : c.surface,
                marginBottom: spacing.xxl,
              })}
              accessibilityRole="button"
              accessibilityLabel="Elegir veterinario"
              accessibilityHint="Abre la lista de veterinarios para elegir con quién atenderte"
            >
              <MaterialCommunityIcons name="account-search-outline" size={24} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink }}>Elegir veterinario</Text>
                <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>O dejá que te asignemos el primero disponible</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={c.inkMuted} />
            </Pressable>
          )}

          <Button
            onPress={onSubmit}
            loading={submitting}
            disabled={!selectedPetId || !reason.trim()}
            size="lg"
            fullWidth
            icon={<MaterialCommunityIcons name="send" size={20} color={c.white} />}
          >
            Solicitar consulta
          </Button>
        </>
      )}
    </ScrollView>
  );
}
