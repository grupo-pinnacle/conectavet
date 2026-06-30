import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { usePets } from '@/hooks/usePets';
import { createPetSchema, type CreatePetPayload, type Species, ApiError } from '@/types';
import { colors, speciesEmoji, speciesLabel } from '@/theme';
import { pickImage, uploadPetPhoto } from '@/utils/permissions';

const SPECIES: Species[] = ['DOG', 'CAT', 'BIRD', 'REPTILE', 'RODENT', 'OTHER'];

export default function NewPetScreen() {
  const router = useRouter();
  const { create } = usePets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePetPayload>({
    resolver: zodResolver(createPetSchema),
    defaultValues: {
      name: '',
      species: 'DOG',
      birthDate: new Date().toISOString(),
      allergies: [],
      chronicConditions: [],
    },
  });

  const species = watch('species');

  const onPickPhoto = async () => {
    const picked = await pickImage();
    if (!picked) return;
    setPhotoUri(picked.uri);
  };

  const onSubmit = async (values: CreatePetPayload) => {
    try {
      let photoUrl: string | undefined;
      if (photoUri) {
        setUploadingPhoto(true);
        photoUrl = await uploadPetPhoto(photoUri);
      }

      // Convert Date object back to ISO for backend
      const payload: CreatePetPayload = {
        ...values,
        birthDate: new Date(values.birthDate).toISOString(),
        photoUrl,
      };

      await create.mutateAsync(payload);
      Toast.show({ type: 'success', text1: 'Mascota creada 🐾' });
      router.replace('/(app)/pets');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo crear la mascota.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 12 }}>
            Datos básicos
          </Text>

          <Pressable onPress={onPickPhoto} style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.border,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              {photoUri ? (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#ddd' }} />
              ) : (
                <Text style={{ fontSize: 40 }}>{speciesEmoji[species as Species] ?? '🐾'}</Text>
              )}
            </View>
            <Text style={{ color: colors.primary, fontSize: 13, marginTop: 6, fontWeight: '600' }}>
              {photoUri ? 'Cambiar foto' : 'Agregar foto (opcional)'}
            </Text>
          </Pressable>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Nombre" placeholder="Firulais" value={value} onChangeText={onChange} error={errors.name?.message} />
            )}
          />

          <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600', marginBottom: 6 }}>
            Especie
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {SPECIES.map((sp) => (
              <Pressable
                key={sp}
                onPress={() => setValue('species', sp)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: species === sp ? colors.primary : colors.surface,
                  borderWidth: 1.5,
                  borderColor: species === sp ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: species === sp ? '#fff' : colors.ink, fontWeight: '600', fontSize: 13 }}>
                  {speciesEmoji[sp]} {speciesLabel[sp]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Controller
            control={control}
            name="breed"
            render={({ field: { onChange, value } }) => (
              <Input label="Raza (opcional)" placeholder="Labrador" value={value ?? ''} onChangeText={onChange} error={errors.breed?.message} />
            )}
          />

          <Controller
            control={control}
            name="birthDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fecha de nacimiento (YYYY-MM-DD)"
                placeholder="2020-05-12"
                value={value.slice(0, 10)}
                onChangeText={(t) => onChange(new Date(t).toISOString())}
                error={errors.birthDate?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="weightKg"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Peso (kg, opcional)"
                placeholder="8.5"
                keyboardType="numeric"
                value={value?.toString() ?? ''}
                onChangeText={(t) => onChange(t ? Number(t) : undefined)}
                error={errors.weightKg?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600', marginBottom: 6 }}>
                  Sexo (opcional)
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {(['MALE', 'FEMALE'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => onChange(s)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 9999,
                        backgroundColor: value === s ? colors.primary : colors.surface,
                        borderWidth: 1.5,
                        borderColor: value === s ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ color: value === s ? '#fff' : colors.ink, fontWeight: '600' }}>
                        {s === 'MALE' ? '♂ Macho' : '♀ Hembra'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="microchip"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Microchip (15 dígitos, opcional)"
                placeholder="000000000000000"
                keyboardType="numeric"
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.microchip?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <Input label="Color (opcional)" placeholder="Marrón" value={value ?? ''} onChangeText={onChange} error={errors.color?.message} />
            )}
          />

          <Controller
            control={control}
            name="allergies"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Alergias (separadas por coma)"
                placeholder="penicilina, pollo"
                value={(value ?? []).join(', ')}
                onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])}
                error={errors.allergies?.message as string | undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="chronicConditions"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Condiciones crónicas (separadas por coma)"
                placeholder="diabetes"
                value={(value ?? []).join(', ')}
                onChangeText={(t) => onChange(t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [])}
                error={errors.chronicConditions?.message as string | undefined}
              />
            )}
          />
        </Card>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Button variant="ghost" onPress={() => router.back()} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={create.isPending || uploadingPhoto}
            style={{ flex: 2 }}
          >
            {uploadingPhoto ? 'Subiendo foto…' : 'Guardar mascota'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
