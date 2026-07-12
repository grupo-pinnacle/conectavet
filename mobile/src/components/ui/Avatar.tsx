import { Image, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, radius, fontSizes, fontWeights } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function Avatar({ uri, name, size = 40, icon }: AvatarProps) {
  const { colors: c } = useTheme();
  const fontSize = size * 0.42;
  const iconSize = size * 0.5;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius.full }}
        accessibilityRole="image"
        accessibilityLabel={name ? `Foto de ${name}` : 'Foto de perfil'}
      />
    );
  }

  if (icon) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: c.primaryBg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        accessibilityRole="image"
        accessibilityLabel={name ?? 'Avatar'}
      >
        <MaterialCommunityIcons name={icon} size={iconSize} color={c.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: c.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      accessibilityRole="image"
      accessibilityLabel={name ? `Inicial de ${name}` : 'Avatar'}
    >
        <Text style={{ color: c.white, fontSize, fontWeight: fontWeights.bold }}>
        {(name ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}
