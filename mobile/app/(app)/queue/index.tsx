import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const createConsultation = useCreateConsultation();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(petId ?? null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pets = list.data ?? [];
  const scrollRef = useRef<ScrollView>(null);

  const { data: selectedVet } = useQuery<Vet | undefined>({
    queryKey: ['queue', 'selectedVet'],
    queryFn: () => qc.getQueryData<Vet>(['queue', 'selectedVet']),
    initialData: () => qc.getQueryData<Vet>(['queue', 'selectedVet']),
  });

  // Si ya venís con un veterinario elegido (desde Veterinarios), arrancamos en
  // "Elegir yo"; si no, la opción por defecto es "Rápido".
  const [vetMode, setVetMode] = useState<'quick' | 'chosen'>(selectedVet ? 'chosen' : 'quick');

  const hasChosenVet = vetMode === 'chosen' && Boolean(selectedVet);

  const clearSelectedVet = () => {
    qc.removeQueries({ queryKey: ['queue', 'selectedVet'] });
    setVetMode('quick');
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
        vetId: hasChosenVet ? selectedVet?.id : undefined,
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
    <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.huge }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5 }}>
        Nueva consulta
      </Text>
      <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 20 }}>
        Contanos qué le pasa y con quién querés hablar. El veterinario decide si te atiende.
      </Text>

      {list.isLoading ? (
        <SkeletonCard />
      ) : pets.length === 0 ? (
        <EmptyState icon="paw" title="Sin mascotas" subtitle="Agregá una mascota antes de pedir una consulta." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>¿Para quién es?</Text>
            <Pressable onPress={() => router.push('/(app)/pets/new')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Agregar mascota">
              <Text style={{ fontSize: fontSizes.body, color: c.primary, fontWeight: fontWeights.semibold }}>+ Nueva</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
            {pets.map((p: Pet) => {
              const selected = selectedPetId === p.id;
              const iconName = (speciesIcon[p.species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPetId(p.id)}
                  style={{
                    width: 132,
                    alignItems: 'center',
                    padding: spacing.md,
                    borderRadius: radius.xl,
                    borderWidth: 1.5,
                    borderColor: selected ? c.primary : c.border,
                    backgroundColor: selected ? c.primaryBg : c.surface,
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Mascota ${p.name}`}
                >
                  <View style={{ width: 56, height: 56, borderRadius: radius.full, backgroundColor: selected ? c.primaryLight : c.borderLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: spacing.sm }}>
                    {p.photoUrl ? (
                      <Image source={{ uri: p.photoUrl }} style={{ width: 56, height: 56 }} accessibilityRole="image" accessibilityLabel={`Foto de ${p.name}`} />
                    ) : (
                      <MaterialCommunityIcons name={iconName} size={28} color={selected ? c.primary : c.inkMuted} />
                    )}
                  </View>
                  <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.ink }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }} numberOfLines={1}>
                    {speciesLabel[p.species] ?? ''} · {p.birthDate ? formatAge(p.birthDate) : '?'}
                  </Text>
                  {selected && (
                    <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check" size={13} color={c.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <MaterialCommunityIcons name="text-box-edit-outline" size={20} color={c.primary} />
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>Motivo de la consulta</Text>
          </View>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.md, lineHeight: 20 }}>
            Describí brevemente qué le pasa a tu mascota. Después podrás agregar más detalles en el chat.
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, marginBottom: spacing.xxl }}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)}
              placeholder="Ej: vomita hace 2 días, no quiere comer…"
              placeholderTextColor={c.inkMuted}
              multiline
              maxLength={300}
              style={{ minHeight: 80, padding: spacing.lg, fontSize: fontSizes.input, color: c.ink, lineHeight: 20, textAlignVertical: 'top' }}
              accessibilityLabel="Motivo de la consulta"
            />
          </View>

          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3, marginBottom: spacing.sm }}>¿Con quién querés hablar?</Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.md, lineHeight: 20 }}>
            Elegí vos al veterinario, o dejá que asignemos el primer disponible.
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Pressable
              onPress={() => setVetMode('quick')}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radius.xl,
                borderWidth: 1.5,
                borderColor: vetMode === 'quick' ? c.primary : c.border,
                backgroundColor: vetMode === 'quick' ? c.primaryBg : c.surface,
                gap: spacing.xs,
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: vetMode === 'quick' }}
              accessibilityLabel="Asignación rápida: primer veterinario disponible"
            >
              <View style={{ width: 34, height: 34, borderRadius: radius.full, backgroundColor: vetMode === 'quick' ? c.primary : c.borderLight, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="flash" size={18} color={vetMode === 'quick' ? c.white : c.inkMuted} />
              </View>
              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.ink }}>Rápido</Text>
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, lineHeight: 16 }}>
                Asignamos el primer veterinario disponible.
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedVet) {
                  setVetMode('chosen');
                } else {
                  setVetMode('chosen');
                  router.push('/(app)/vets');
                }
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radius.xl,
                borderWidth: 1.5,
                borderColor: vetMode === 'chosen' ? c.primary : c.border,
                backgroundColor: vetMode === 'chosen' ? c.primaryBg : c.surface,
                gap: spacing.xs,
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: vetMode === 'chosen' }}
              accessibilityLabel="Elegir veterinario"
              accessibilityHint="Abre la lista de veterinarios para elegir con quién atenderte"
            >
              <View style={{ width: 34, height: 34, borderRadius: radius.full, backgroundColor: vetMode === 'chosen' ? c.primary : c.borderLight, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="account-search" size={18} color={vetMode === 'chosen' ? c.white : c.inkMuted} />
              </View>
              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.ink }}>Elegir yo</Text>
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, lineHeight: 16 }}>
                {selectedVet ? 'Veterinario elegido por vos.' : 'Buscá por calificación y opiniones.'}
              </Text>
            </Pressable>
          </View>

          {selectedVet ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1.5, borderColor: c.primary, backgroundColor: c.primaryBg, marginBottom: spacing.xxl }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={22} color={c.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink }} numberOfLines={1}>
                  {[selectedVet.firstName, selectedVet.lastName].filter(Boolean).join(' ')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {typeof selectedVet.ratingAvg === 'number' && selectedVet.ratingCount ? (
                    <>
                      <MaterialCommunityIcons name="star" size={12} color={c.accent} />
                      <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>
                        {selectedVet.ratingAvg.toFixed(1)} ({selectedVet.ratingCount} opiniones)
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Sin calificaciones</Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/(app)/vets')}
                hitSlop={8}
                style={{ paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: c.primary }}
                accessibilityRole="button"
                accessibilityLabel="Cambiar veterinario elegido"
              >
                <Text style={{ fontSize: fontSizes.label, color: c.primary, fontWeight: fontWeights.semibold }}>Cambiar</Text>
              </Pressable>
            </View>
          ) : null}

          <Button
            onPress={onSubmit}
            loading={submitting}
            disabled={!selectedPetId || !reason.trim()}
            size="lg"
            fullWidth
            icon={<MaterialCommunityIcons name="send" size={20} color={c.white} />}
          >
            {hasChosenVet ? `Consultar a ${selectedVet?.firstName ?? 'veterinario'}` : 'Solicitar consulta'}
          </Button>
        </>
      )}
    </ScrollView>
  );
}
