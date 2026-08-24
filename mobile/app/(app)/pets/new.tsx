import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { usePets } from '@/hooks/usePets';
import { createPetSchema, type CreatePetPayload, type Species, ApiError } from '@/types';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { pickImage, uploadPetPhoto } from '@/utils/permissions';

const SPECIES: Species[] = ['DOG', 'CAT', 'BIRD', 'REPTILE', 'RODENT', 'OTHER'];

const SPECIES_COLORS: Record<string, { bg: string; fg: string; ring: string }> = {
  DOG: { bg: '#CCFBF1', fg: '#0F766E', ring: '#14B8A6' },
  CAT: { bg: '#FEF3C7', fg: '#D97706', ring: '#FBBF24' },
  BIRD: { bg: '#DCFCE7', fg: '#15803D', ring: '#4ADE80' },
  REPTILE: { bg: '#E0F2FE', fg: '#0369A1', ring: '#38BDF8' },
  RODENT: { bg: '#EDE9FE', fg: '#6D28D9', ring: '#A78BFA' },
  OTHER: { bg: '#FEE2E2', fg: '#B91C1C', ring: '#F87171' },
};

export default function NewPetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { create } = usePets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatBirthDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreatePetPayload>({
    resolver: zodResolver(createPetSchema),
    defaultValues: { name: '', species: 'DOG', birthDate: new Date().toISOString(), allergies: [], chronicConditions: [] },
  });

  const species = watch('species');
  const currentIcon = (speciesIcon[species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
  const speciesColors = SPECIES_COLORS[species] ?? SPECIES_COLORS.OTHER;

  const onPickPhoto = async () => {
    const picked = await pickImage();
    if (!picked) return;
    setPhotoUri(picked.uri);
  };

  const onSubmit = async (values: CreatePetPayload) => {
    try {
      let photoUrl: string | undefined;
      if (photoUri) { setUploadingPhoto(true); photoUrl = await uploadPetPhoto(photoUri); }
      const payload: CreatePetPayload = { ...values, birthDate: new Date(values.birthDate).toISOString(), photoUrl };
      await create.mutateAsync(payload);
      Toast.show({ type: 'success', text1: 'Mascota registrada', text2: `${values.name} fue agregado correctamente.` });
      router.replace('/(app)/pets');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos guardar la mascota. Intentá de nuevo.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally { setUploadingPhoto(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.huge }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onPickPhoto} style={{ alignItems: 'center', marginBottom: spacing.xl }} accessibilityRole="button" accessibilityLabel={photoUri ? 'Cambiar foto' : 'Agregar foto'}>
          <View style={{ width: 112, height: 112, borderRadius: radius.full, backgroundColor: speciesColors.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 3, borderColor: speciesColors.ring }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} accessibilityRole="image" accessibilityLabel="Foto seleccionada" />
            ) : (
              <MaterialCommunityIcons name={currentIcon} size={52} color={speciesColors.fg} />
            )}
            {!photoUri && (
              <View style={{ position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: radius.full, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="camera-plus" size={16} color={c.primary} />
              </View>
            )}
          </View>
          <Text style={{ color: c.primary, fontSize: fontSizes.body, marginTop: spacing.md, fontWeight: fontWeights.semibold }}>
            {photoUri ? 'Cambiar foto' : 'Agregá una foto (opcional)'}
          </Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, textAlign: 'center' }}>
            Conocé a tu compañero
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 }}>
            Completá sus datos para crear su ficha clínica digital.
          </Text>
        </View>

        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <Input label="¿Cómo se llama?" placeholder="Firulais" value={value} onChangeText={onChange} error={errors.name?.message} leftIcon="paw" />
        )} />

        <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.semibold, marginBottom: spacing.sm }}>Especie</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          {SPECIES.map((sp) => {
            const selected = species === sp;
            const spIcon = (speciesIcon[sp] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
            const spColors = SPECIES_COLORS[sp] ?? SPECIES_COLORS.OTHER;
            return (
              <Pressable
                key={sp}
                onPress={() => setValue('species', sp)}
                style={{
                  flexBasis: '30%',
                  flexGrow: 1,
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xs,
                  borderRadius: radius.xl,
                  backgroundColor: selected ? c.surface : spColors.bg,
                  borderWidth: 2,
                  borderColor: selected ? c.primary : 'transparent',
                  gap: spacing.xs,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={speciesLabel[sp]}
              >
                <MaterialCommunityIcons name={spIcon} size={26} color={selected ? c.primary : spColors.fg} />
                <Text style={{ color: selected ? c.primary : spColors.fg, fontWeight: fontWeights.semibold, fontSize: fontSizes.label }}>
                  {speciesLabel[sp]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Controller control={control} name="breed" render={({ field: { onChange, value } }) => (
          <Input label="Raza (opcional)" placeholder="Labrador" value={value ?? ''} onChangeText={onChange} error={errors.breed?.message} />
        )} />

        <Controller control={control} name="birthDate" render={({ field: { onChange, value } }) => (
          <>
            <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.medium, marginBottom: spacing.xs, letterSpacing: 0.2 }}>
              Fecha de nacimiento
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: c.surface, borderRadius: radius.lg,
                borderWidth: 1.5, borderColor: errors.birthDate?.message ? c.danger : c.border,
                paddingHorizontal: spacing.lg, minHeight: 48,
                marginBottom: spacing.xs,
              }}
              accessibilityRole="button"
              accessibilityLabel="Elegir fecha de nacimiento"
              accessibilityHint="Abrir calendario para elegir la fecha"
            >
              <MaterialCommunityIcons name="calendar-outline" size={20} color={c.inkMuted} style={{ marginRight: spacing.sm }} />
              <Text style={{ flex: 1, fontSize: fontSizes.input, color: value ? c.ink : c.inkMuted }}>
                {value ? formatBirthDate(value) : 'Elegí la fecha…'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={c.inkMuted} />
            </Pressable>
            {errors.birthDate?.message ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={c.danger} />
                <Text style={{ fontSize: fontSizes.label, color: c.danger, flex: 1 }}>{errors.birthDate.message}</Text>
              </View>
            ) : null}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(event: DateTimePickerEvent, selected?: Date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selected) onChange(selected.toISOString());
                }}
              />
            )}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm }}>
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event: DateTimePickerEvent, selected?: Date) => {
                    if (selected) onChange(selected.toISOString());
                    if (event.type === 'set' || event.type === 'dismissed') setShowDatePicker(false);
                  }}
                />
                <Button variant="ghost" onPress={() => setShowDatePicker(false)} size="sm">Listo</Button>
              </View>
            )}
          </>
        )} />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Controller control={control} name="weightKg" render={({ field: { onChange, value } }) => (
            <View style={{ flex: 1 }}>
              <Input label="Peso (kg)" placeholder="8.5" keyboardType="numeric" value={value?.toString() ?? ''} onChangeText={(t) => onChange(t ? Number(t) : undefined)} error={errors.weightKg?.message} />
            </View>
          )} />
          <Controller control={control} name="sex" render={({ field: { onChange, value } }) => (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.semibold, marginBottom: spacing.sm }}>Sexo</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['MALE', 'FEMALE'] as const).map((s) => {
                  const selected = value === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => onChange(s)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: spacing.md,
                        borderRadius: radius.xl,
                        backgroundColor: selected ? c.primaryBg : c.surface,
                        borderWidth: 1.5,
                        borderColor: selected ? c.primary : c.border,
                        gap: 2,
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={s === 'MALE' ? 'Macho' : 'Hembra'}
                    >
                      <MaterialCommunityIcons name={s === 'MALE' ? 'gender-male' : 'gender-female'} size={20} color={selected ? c.primary : c.inkMuted} />
                      <Text style={{ fontSize: fontSizes.label, color: selected ? c.primary : c.inkMuted, fontWeight: fontWeights.semibold }}>
                        {s === 'MALE' ? 'Macho' : 'Hembra'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )} />
        </View>

        <Controller control={control} name="color" render={({ field: { onChange, value } }) => (
          <Input label="Color (opcional)" placeholder="Marrón" value={value ?? ''} onChangeText={onChange} error={errors.color?.message} />
        )} />

        <Controller control={control} name="microchip" render={({ field: { onChange, value } }) => (
          <Input label="Microchip (15 dígitos, opcional)" placeholder="000000000000000" keyboardType="numeric" value={value ?? ''} onChangeText={onChange} error={errors.microchip?.message} />
        )} />

        <Controller control={control} name="allergies" render={({ field: { onChange, value } }) => (
          <Input label="Alergias (separadas por coma)" placeholder="penicilina, pollo" value={(value ?? []).join(', ')} onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])} error={errors.allergies?.message as string | undefined} leftIcon="alert-outline" />
        )} />

        <Controller control={control} name="chronicConditions" render={({ field: { onChange, value } }) => (
          <Input label="Condiciones crónicas (separadas por coma)" placeholder="diabetes" value={(value ?? []).join(', ')} onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])} error={errors.chronicConditions?.message as string | undefined} />
        )} />

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Button variant="ghost" onPress={() => router.back()} style={{ flex: 1 }}>Cancelar</Button>
          <Button onPress={handleSubmit(onSubmit)} loading={create.isPending || uploadingPhoto} style={{ flex: 2 }} icon={<MaterialCommunityIcons name="paw" size={18} color={c.white} />}>
            {uploadingPhoto ? 'Subiendo foto…' : 'Registrar mascota'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
