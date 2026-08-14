import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthImage } from '../AuthImage';
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
      <AuthImage
        uri={uri}
        style={{ width: size, height: size, borderRadius: radius.full }}
        resizeMode="cover"
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

  const initial = name && name.trim().length > 0 ? name.trim()[0] : '?';

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
        {initial.toUpperCase()}
      </Text>
    </View>
  );
}
