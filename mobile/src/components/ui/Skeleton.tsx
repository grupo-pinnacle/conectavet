import { View, type DimensionValue } from 'react-native';
import { colors } from '@/theme';

export function Skeleton({ width = '100%' as DimensionValue, height = 16, radius = 6 }: { width?: DimensionValue; height?: number; radius?: number }) {
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: colors.border,
        borderRadius: radius,
        opacity: 0.6,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <Skeleton width="60%" height={18} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="40%" height={14} />
    </View>
  );
}
