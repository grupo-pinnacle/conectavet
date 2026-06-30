import { Text, View } from 'react-native';
import { colors } from '@/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, color = colors.surface, bg = colors.primary }: BadgeProps) {
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
