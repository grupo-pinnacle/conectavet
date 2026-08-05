import { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge } from './ui';
import { useTheme, spacing, radius, fontSizes, fontWeights, speciesIcon, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import type { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onPress?: (pet: Pet) => void;
}

export const PetCard = memo(function PetCard({ pet, onPress }: PetCardProps) {
  const { colors: c } = useTheme();
  const iconName = (speciesIcon[pet.species] ?? 'paw') as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <Pressable
      onPress={() => onPress?.(pet)}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${speciesLabel[pet.species] ?? pet.species}`}
      accessibilityHint="Ver detalle de la mascota"
    >
      <Card padding={0} variant="elevated" style={{ overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: c.primaryBg,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {pet.photoUrl ? (
              <Image source={{ uri: pet.photoUrl }} style={{ width: 96, height: 96 }} accessibilityRole="image" accessibilityLabel={`Foto de ${pet.name}`} />
            ) : (
              <MaterialCommunityIcons name={iconName} size={40} color={c.primary} />
            )}
          </View>
          <View style={{ flex: 1, padding: spacing.lg, gap: 3, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }} numberOfLines={1}>
                {pet.name}
              </Text>
              {pet.isDeceased && <Badge label="En memoria" bg={c.inkMuted} icon="heart" size="sm" />}
            </View>
            <Text style={{ fontSize: fontSizes.body, color: c.inkSoft }}>
              {speciesLabel[pet.species] ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </Text>
            <Text style={{ fontSize: fontSizes.body, color: c.inkMuted }}>
              {pet.birthDate ? formatAge(pet.birthDate) : '?'}
              {pet.weightKg ? ` · ${pet.weightKg} kg` : ''}
            </Text>
            {pet.allergies && pet.allergies.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                {pet.allergies.slice(0, 2).map((a) => (
                  <Badge key={a} label={a} variant="soft" bg={c.accentBg} color={c.accentDark} size="sm" icon="alert" />
                ))}
                {pet.allergies.length > 2 && (
                  <Badge label={`+${pet.allergies.length - 2}`} variant="outlined" size="sm" />
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});
