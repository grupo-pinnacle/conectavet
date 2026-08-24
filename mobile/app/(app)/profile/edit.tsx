import { useState } from 'react';
import { ScrollView, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { Input, Button } from '@/components/ui';
import { useTheme, spacing, fontSizes, fontWeights } from '@/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const isVet = user?.role === 'VET';

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [specialty, setSpecialty] = useState(user?.specialty ?? '');

  const onSave = () => {
    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        bio: bio.trim() || null,
        specialty: isVet ? (specialty.trim() || null) : undefined,
      },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.huge }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.5, marginBottom: spacing.xl }}>
          Editar perfil
        </Text>

        <Input
          label="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Tu nombre"
          leftIcon="account-outline"
          accessibilityLabel="Nombre"
        />
        <Input
          label="Apellido"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Tu apellido"
          leftIcon="account-outline"
          accessibilityLabel="Apellido"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          placeholder="+54 11 5555 1234"
          leftIcon="phone-outline"
          keyboardType="phone-pad"
          accessibilityLabel="Teléfono"
        />
        {isVet && (
          <Input
            label="Especialidad"
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="Ej: Dermatología, Cardiología…"
            leftIcon="stethoscope"
            accessibilityLabel="Especialidad"
          />
        )}
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder={isVet ? 'Contanos sobre tu experiencia…' : 'Algo sobre vos…'}
          leftIcon="note-text-outline"
          multiline
          maxLength={500}
          accessibilityLabel="Bio"
        />

        {updateProfile.isError && (
          <Text style={{ fontSize: 13, color: c.danger, marginBottom: spacing.md, textAlign: 'center' }}>
            {(updateProfile.error as any)?.message ?? 'No pudimos guardar los cambios. Intentá de nuevo.'}
          </Text>
        )}

        <Button
          variant="primary"
          loading={updateProfile.isPending}
          onPress={onSave}
          accessibilityLabel="Guardar cambios del perfil"
        >
          Guardar cambios
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
