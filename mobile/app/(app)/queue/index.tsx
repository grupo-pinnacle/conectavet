import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Input, EmptyState, SkeletonCard } from '@/components/ui';
import { QueueStatus } from '@/components/QueueStatus';
import { useQueue } from '@/hooks/useQueue';
import { usePets } from '@/hooks/usePets';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import { ApiError, type Pet } from '@/types';

export default function QueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { colors: c } = useTheme();
  const { myEntry, join, cancel, isFetching } = useQueue();
  const { list } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(params.petId ?? null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pets = list.data ?? [];

  const onJoin = async () => {
    if (!selectedPetId) {
      Toast.show({ type: 'error', text1: 'Seleccioná una mascota', text2: 'Elegí cuál de tus mascotas necesita atención.' });
      return;
    }
    if (reason.trim().length < 5) {
      Toast.show({ type: 'error', text1: 'Describí el motivo', text2: 'Contanos brevemente qué le pasa a tu mascota (mín. 5 caracteres).' });
      return;
    }
    setSubmitting(true);
    try {
      await join.mutateAsync({ petId: selectedPetId, reason: reason.trim() });
      Toast.show({ type: 'success', text1: 'Te uniste a la cola', text2: 'Te notificaremos cuando un veterinario esté disponible.' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos agregarte a la cola. Intentá de nuevo.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    Alert.alert('Cancelar consulta', '¿Estás seguro de que querés salir de la cola?', [
      { text: 'Seguir esperando', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        try {
          await cancel.mutateAsync();
          Toast.show({ type: 'success', text1: 'Saliste de la cola', text2: 'Podés volver a unirte cuando quieras.' });
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : 'No se pudo cancelar.';
          Toast.show({ type: 'error', text2: msg });
        }
      }},
    ]);
  };

  if (isFetching && !myEntry) {
    return <View style={{ padding: spacing.lg, gap: spacing.md }}><SkeletonCard /></View>;
  }

  if (myEntry && myEntry.status !== 'COMPLETED' && myEntry.status !== 'CANCELLED') {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <QueueStatus entry={myEntry} onCancel={onCancel} isCancelling={cancel.isPending} onJoinCall={myEntry.livekitToken && myEntry.livekitRoomName ? () => router.push(`/(app)/call/${myEntry.id}`) : undefined} />
        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <MaterialCommunityIcons name="lightbulb-outline" size={18} color={c.accent} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, lineHeight: 18, flex: 1 }}>
              Mantené la app abierta mientras esperás. Si perdés conexión, tenés 60 segundos para reconectarte sin perder tu lugar en la cola.
            </Text>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}>
      <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, marginBottom: spacing.xs }}>
        Pedir videollamada
      </Text>
      <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.xxl, maxWidth: 300 }}>
        Te conectaremos con el primer veterinario disponible, por orden de llegada.
      </Text>

      <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink, marginBottom: spacing.md }}>
        Seleccioná la mascota
      </Text>

      {list.isLoading ? (
        <SkeletonCard />
      ) : pets.length === 0 ? (
        <Card>
          <EmptyState icon="paw" title="Sin mascotas registradas" subtitle="Agregá una mascota antes de pedir una videollamada." ctaLabel="Agregar mascota" onCta={() => router.push('/(app)/pets/new')} />
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

      <Button onPress={onJoin} loading={submitting} disabled={pets.length === 0} size="lg" fullWidth style={{ marginTop: spacing.lg }} icon={<MaterialCommunityIcons name="clock-outline" size={20} color={c.white} />}>
        Unirme a la cola
      </Button>
    </ScrollView>
  );
}
