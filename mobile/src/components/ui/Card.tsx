import { View, type ViewProps } from 'react-native';
import { colors } from '@/theme';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ padding = 16, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
