import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, spacing } from '@/theme';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  disabled?: boolean;
}

export function RatingStars({ value, onChange, size = 22, disabled = false }: RatingStarsProps) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const content = (
          <MaterialCommunityIcons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? c.accent : c.border}
          />
        );
        if (disabled) {
          return <View key={star}>{content}</View>;
        }
        return (
          <Pressable
            key={star}
            onPress={() => onChange?.(star)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
