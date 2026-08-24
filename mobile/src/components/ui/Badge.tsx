import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, radius, spacing, fontSizes, fontWeights } from '@/theme';

type BadgeVariant = 'filled' | 'soft' | 'outlined';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

const sizeStyles = {
  sm: { px: spacing.sm, py: 2, fontSize: fontSizes.caption, iconSize: 12, gap: 3 },
  md: { px: spacing.md, py: spacing.xs, fontSize: fontSizes.label, iconSize: 14, gap: 4 },
};

export function Badge({ label, color, bg, variant = 'filled', size = 'md', icon, style }: BadgeProps) {
  const { colors: c } = useTheme();
  const s = sizeStyles[size];

  const config = {
    filled: { bg: bg ?? c.primary, text: color ?? c.white, border: 'transparent' },
    soft: { bg: bg ?? c.primaryBg, text: color ?? c.primary, border: 'transparent' },
    outlined: { bg: 'transparent', text: color ?? c.ink, border: bg ?? c.border },
  }[variant];

  return (
    <View
      style={[{
        backgroundColor: config.bg,
        paddingHorizontal: s.px,
        paddingVertical: s.py,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: s.gap,
        borderWidth: variant === 'outlined' ? 1 : 0,
        borderColor: config.border,
        minHeight: 20,
      }, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon && <MaterialCommunityIcons name={icon} size={s.iconSize} color={config.text} />}
      <Text style={{ color: config.text, fontSize: s.fontSize, fontWeight: fontWeights.semibold }}>
        {label}
      </Text>
    </View>
  );
}
