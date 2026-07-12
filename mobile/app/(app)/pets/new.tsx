import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card } from '@/components/ui';
import { usePets } from '@/hooks/usePets';
import { createPetSchema, type CreatePetPayload, type Species, ApiError } from '@/types';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { pickImage, uploadPetPhoto } from '@/utils/permissions';

const SPECIES: Species[] = ['DOG', 'CAT', 'BIRD', 'REPTILE', 'RODENT', 'OTHER'];

export default function NewPetScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { create } = usePets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreatePetPayload>({
    resolver: zodResolver(createPetSchema),
    defaultValues: { name: '', species: 'DOG', birthDate: new Date().toISOString(), allergies: [], chronicConditions: [] },
  });

  const species = watch('species');
  const currentIcon = (speciesIcon[species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }} keyboardShouldPersistTaps="handled">
        <Card>
          <Pressable onPress={onPickPhoto} style={{ alignItems: 'center', marginBottom: spacing.lg }} accessibilityRole="button" accessibilityLabel={photoUri ? 'Cambiar foto' : 'Agregar foto'}>
            <View style={{ width: 96, height: 96, borderRadius: radius.full, backgroundColor: c.borderLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: c.border }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} accessibilityRole="image" accessibilityLabel="Foto seleccionada" />
              ) : (
                <MaterialCommunityIcons name={currentIcon} size={44} color={c.primary} />
              )}
            </View>
            <Text style={{ color: c.primary, fontSize: fontSizes.body, marginTop: spacing.md, fontWeight: fontWeights.semibold }}>
              {photoUri ? 'Cambiar foto' : 'Agregar foto (opcional)'}
            </Text>
          </Pressable>

          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <Input label="Nombre" placeholder="Firulais" value={value} onChangeText={onChange} error={errors.name?.message} leftIcon="paw" />
          )} />

          <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.semibold, marginBottom: spacing.sm }}>Especie</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {SPECIES.map((sp) => {
              const selected = species === sp;
              const spIcon = (speciesIcon[sp] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;
              return (
                <Pressable key={sp} onPress={() => setValue('species', sp)} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: selected ? c.primary : c.surface, borderWidth: 1.5, borderColor: selected ? c.primary : c.border }} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={speciesLabel[sp]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <MaterialCommunityIcons name={spIcon} size={16} color={selected ? c.white : c.ink} />
                    <Text style={{ color: selected ? c.white : c.ink, fontWeight: fontWeights.semibold, fontSize: fontSizes.body }}>{speciesLabel[sp]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Controller control={control} name="breed" render={({ field: { onChange, value } }) => (
            <Input label="Raza (opcional)" placeholder="Labrador" value={value ?? ''} onChangeText={onChange} error={errors.breed?.message} />
          )} />

          <Controller control={control} name="birthDate" render={({ field: { onChange, value } }) => (
            <Input label="Fecha de nacimiento" placeholder="2020-05-12" value={value.slice(0, 10)} onChangeText={(t) => onChange(new Date(t).toISOString())} error={errors.birthDate?.message} leftIcon="calendar-outline" />
          )} />

          <Controller control={control} name="weightKg" render={({ field: { onChange, value } }) => (
            <Input label="Peso (kg, opcional)" placeholder="8.5" keyboardType="numeric" value={value?.toString() ?? ''} onChangeText={(t) => onChange(t ? Number(t) : undefined)} error={errors.weightKg?.message} />
          )} />

          <Controller control={control} name="sex" render={({ field: { onChange, value } }) => (
            <View>
              <Text style={{ fontSize: fontSizes.body, color: c.ink, fontWeight: fontWeights.semibold, marginBottom: spacing.sm }}>Sexo (opcional)</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                {(['MALE', 'FEMALE'] as const).map((s) => {
                  const selected = value === s;
                  return (
                    <Pressable key={s} onPress={() => onChange(s)} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: selected ? c.primary : c.surface, borderWidth: 1.5, borderColor: selected ? c.primary : c.border, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={s === 'MALE' ? 'Macho' : 'Hembra'}>
                      <MaterialCommunityIcons name={s === 'MALE' ? 'gender-male' : 'gender-female'} size={16} color={selected ? c.white : c.ink} />
                      <Text style={{ color: selected ? c.white : c.ink, fontWeight: fontWeights.semibold }}>{s === 'MALE' ? 'Macho' : 'Hembra'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )} />

          <Controller control={control} name="microchip" render={({ field: { onChange, value } }) => (
            <Input label="Microchip (15 dígitos, opcional)" placeholder="000000000000000" keyboardType="numeric" value={value ?? ''} onChangeText={onChange} error={errors.microchip?.message} />
          )} />

          <Controller control={control} name="color" render={({ field: { onChange, value } }) => (
            <Input label="Color (opcional)" placeholder="Marrón" value={value ?? ''} onChangeText={onChange} error={errors.color?.message} />
          )} />

          <Controller control={control} name="allergies" render={({ field: { onChange, value } }) => (
            <Input label="Alergias (separadas por coma)" placeholder="penicilina, pollo" value={(value ?? []).join(', ')} onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])} error={errors.allergies?.message as string | undefined} leftIcon="alert-outline" />
          )} />

          <Controller control={control} name="chronicConditions" render={({ field: { onChange, value } }) => (
            <Input label="Condiciones crónicas (separadas por coma)" placeholder="diabetes" value={(value ?? []).join(', ')} onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])} error={errors.chronicConditions?.message as string | undefined} />
          )} />
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Button variant="ghost" onPress={() => router.back()} style={{ flex: 1 }}>Cancelar</Button>
          <Button onPress={handleSubmit(onSubmit)} loading={create.isPending || uploadingPhoto} style={{ flex: 2 }}>
            {uploadingPhoto ? 'Subiendo foto…' : 'Guardar mascota'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
