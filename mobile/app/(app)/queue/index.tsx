import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Input, EmptyState, SkeletonCard } from '@/components/ui';
import { useCreateConsultation } from '@/hooks/useConsultations';
import { usePets } from '@/hooks/usePets';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import { ApiError, type Pet } from '@/types';

export default function QueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { colors: c } = useTheme();
  const { list } = usePets();
  const createConsultation = useCreateConsultation();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(params.petId ?? null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pets = list.data ?? [];

  const onSubmit = async () => {
    if (!selectedPetId) {
      Toast.show({ type: 'error', text1: 'Seleccioná una mascota', text2: 'Elegí cuál de tus mascotas necesita atención.' });
      return;
    }
    if (reason.trim().length < 5) {
      Toast.show({ type: 'error', text1: 'Describí el motivo', text2: 'Contanos brevemente qué le pasa a tu mascota (mín. 5 caracteres).' });
      return;
    }
    try {
      await createConsultation.mutateAsync({ petId: selectedPetId, reason: reason.trim() });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos crear la consulta. Intentá de nuevo.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    }
  };

  if (submitted) {
    const selectedPet = pets.find((p) => p.id === selectedPetId);
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flex: 1, justifyContent: 'center' }}>
        <Card style={{ alignItems: 'center', padding: spacing.xxl }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: c.successBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialCommunityIcons name="check-circle" size={36} color={c.success} />
          </View>
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, textAlign: 'center', marginBottom: spacing.md }}>
            Consulta solicitada
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg }}>
            {selectedPet?.name ? `Recibimos tu consulta sobre ${selectedPet.name}.` : 'Recibimos tu consulta.'} Un veterinario la atenderá a la brevedad. Te notificaremos cuando haya novedades.
          </Text>
          <View style={{ gap: spacing.md, width: '100%' }}>
            <Button onPress={() => router.push('/(app)/chat')} size="md" fullWidth>
              Ir a mis consultas
            </Button>
            <Button variant="outline" onPress={() => router.push('/(app)')} size="md" fullWidth>
              Volver al inicio
            </Button>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}>
      <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, marginBottom: spacing.xs }}>
        Solicitar consulta
      </Text>
      <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.xxl, maxWidth: 300 }}>
        Describí el motivo para que el veterinario pueda prepararse.
      </Text>

      <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink, marginBottom: spacing.md }}>
        Seleccioná la mascota
      </Text>

      {list.isLoading ? (
        <SkeletonCard />
      ) : pets.length === 0 ? (
        <Card>
          <EmptyState icon="paw" title="Sin mascotas registradas" subtitle="Agregá una mascota antes de pedir una consulta." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
        </Card>
      ) : (
        <View style={{ gap: spacing.md, marginBottom: spacing.xxl }}>
          {pets.map((p: Pet) => {
            const selected = selectedPetId === p.id;
            const iconName = (speciesIcon[p.species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPetId(p.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
                  borderRadius: radius.xl, borderWidth: 1.5,
                  borderColor: selected ? c.primary : c.border,
                  backgroundColor: selected ? c.primaryBg : c.surface,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${p.name}, ${speciesLabel[p.species] ?? ''}`}
              >
                <MaterialCommunityIcons name={iconName} size={28} color={selected ? c.primary : c.inkSoft} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>{p.name}</Text>
                  <Text style={{ fontSize: fontSizes.label, color: c.inkMuted }}>{speciesLabel[p.species]} · {formatAge(p.birthDate)}</Text>
                </View>
                {selected && (
                  <View style={{ width: 24, height: 24, borderRadius: radius.full, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="check" size={16} color={c.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Input
        label="Motivo de consulta"
        placeholder="Ej: mi perro tiene vómitos desde ayer y está decaído."
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        containerStyle={{ marginBottom: spacing.lg }}
        hint="Describí los síntomas para que el veterinario pueda prepararse mejor."
        leftIcon="clipboard-text-outline"
      />

      <Button onPress={onSubmit} loading={createConsultation.isPending} disabled={pets.length === 0} size="lg" fullWidth style={{ marginTop: spacing.lg }} icon={<MaterialCommunityIcons name="send" size={20} color={c.white} />}>
        Solicitar consulta
      </Button>
    </ScrollView>
  );
}
