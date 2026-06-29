import { Image, Pressable, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { colors, speciesEmoji, speciesLabel } from '@/theme';
import { formatAge } from '@/utils/format';
import type { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onPress?: (pet: Pet) => void;
}

export function PetCard({ pet, onPress }: PetCardProps) {
  return (
    <Pressable onPress={() => onPress?.(pet)} style={{ marginBottom: 12 }}>
      <Card padding={0}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              width: 88,
              height: 88,
              backgroundColor: colors.border,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {pet.photoUrl ? (
              <Image source={{ uri: pet.photoUrl }} style={{ width: 88, height: 88 }} />
            ) : (
              <Text style={{ fontSize: 36 }}>{speciesEmoji[pet.species] ?? '🐾'}</Text>
            )}
          </View>

          <View style={{ flex: 1, padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                {pet.name}
              </Text>
              {pet.isDeceased && <Badge label="🌈" bg={colors.inkMuted} />}
            </View>
            <Text style={{ fontSize: 13, color: colors.inkSoft }}>
              {speciesLabel[pet.species] ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </Text>
            <Text style={{ fontSize: 13, color: colors.inkMuted }}>
              {formatAge(pet.birthDate)}
              {pet.weightKg ? ` · ${pet.weightKg} kg` : ''}
            </Text>
            {pet.allergies.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {pet.allergies.slice(0, 2).map((a) => (
                  <Badge key={a} label={`⚠ ${a}`} bg={colors.accentDark} color="#fff" />
                ))}
                {pet.allergies.length > 2 && (
                  <Badge label={`+${pet.allergies.length - 2}`} bg={colors.border} color={colors.ink} />
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
