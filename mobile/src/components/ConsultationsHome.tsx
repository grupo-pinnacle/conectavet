import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationsService, petsService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { Consultation, Pet } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'En espera',
  PENDING: 'Ofrecida',
  ACTIVE: 'En curso',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export default function ConsultationsHome({ onOpen }: { onOpen: (id: string) => void }) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const { data: consults, isLoading } = useQuery({
    queryKey: ['consultations', 'my-history'],
    queryFn: () => consultationsService.myHistory() as Promise<Consultation[]>,
  });
  const { data: pets } = useQuery({ queryKey: ['pets'], queryFn: () => petsService.list() as Promise<Pet[]> });

  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('Perro');
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createConsult = useMutation({
    mutationFn: async () => {
      let petId = selectedPet;
      if (!petId) {
        if (!petName.trim()) throw new Error('Ingresá el nombre de tu mascota');
        const pet = await petsService.create({ name: petName.trim(), species });
        petId = pet.id;
      }
      return consultationsService.create({ petId: petId!, notes: notes.trim() || undefined });
    },
    onSuccess: (created) => {
      setShowForm(false);
      setNotes(''); setPetName(''); setSelectedPet(null); setFormError(null);
      qc.invalidateQueries({ queryKey: ['consultations'] });
      onOpen(created.id);
    },
    onError: (e: any) => setFormError(e?.message || 'No se pudo crear la consulta'),
  });

  const renderItem = ({ item }: { item: Consultation }) => (
    <TouchableOpacity
      onPress={() => onOpen(item.id)}
      style={{ padding: spacing.lg, backgroundColor: c.card, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink }}>Consulta</Text>
        <Text style={{ fontSize: fontSizes.label, color: c.primary }}>{STATUS_LABEL[item.status] ?? item.status}</Text>
      </View>
      {item.notes ? <Text style={{ color: c.textMuted, marginTop: 4 }} numberOfLines={2}>{item.notes}</Text> : null}
      <Text style={{ color: c.textMuted, fontSize: fontSizes.label, marginTop: 4 }}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ fontSize: fontSizes.h2, fontWeight: fontWeights.bold, color: c.ink }}>Mis consultas</Text>
        <Button size="sm" onPress={() => setShowForm(true)}>+ Nueva</Button>
      </View>

      {isLoading ? (
        <EmptyState icon="clock-outline" title="Cargando…" />
      ) : !consults || consults.length === 0 ? (
        <EmptyState
          icon="chat-processing"
          title="Todavía no tenés consultas"
          subtitle="Iniciá una para hablar con un veterinario."
          ctaLabel="Nueva consulta"
          onCta={() => setShowForm(true)}
        />
      ) : (
        <FlatList data={consults} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: spacing.xl }} />
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg, padding: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.h2, fontWeight: fontWeights.bold, color: c.ink, marginBottom: spacing.lg }}>Nueva consulta</Text>

          <Text style={{ color: c.textMuted, marginBottom: spacing.sm }}>Seleccioná una mascota:</Text>
          <FlatList
            data={pets ?? []}
            horizontal
            keyExtractor={(p) => p.id}
            style={{ marginBottom: spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedPet(item.id)}
                style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 2,
                  borderColor: selectedPet === item.id ? c.primary : c.border,
                  marginRight: spacing.sm,
                  backgroundColor: c.card,
                }}
              >
                <Text style={{ color: c.ink }}>{item.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: fontSizes.label }}>{item.species}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={{ color: c.textMuted, marginBottom: spacing.sm }}>O creá una nueva:</Text>
          <Input label="Nombre de la mascota" value={petName} onChangeText={setPetName} placeholder="Firulais" />
          <Input label="Especie" value={species} onChangeText={setSpecies} placeholder="Perro / Gato" />

          <Input
            label="Motivo (opcional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="¿Qué le pasa a tu mascota?"
            multiline
          />

          {formError && <Text style={{ color: c.danger, marginBottom: spacing.md }}>{formError}</Text>}

          <Button loading={createConsult.isPending} onPress={() => createConsult.mutate()} fullWidth>
            Crear consulta
          </Button>
          <Button variant="ghost" onPress={() => setShowForm(false)} fullWidth>Cancelar</Button>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
