import { Tabs } from 'expo-router';
import { Pressable, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePushToken } from '@/hooks/usePushToken';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { Avatar, Button } from '@/components/ui';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const tabs: { name: string; label: string; icon: IconName; iconFocused: IconName }[] = [
  { name: 'index', label: 'Inicio', icon: 'home-outline', iconFocused: 'home' },
  { name: 'pets/index', label: 'Mascotas', icon: 'paw-outline', iconFocused: 'paw' },
  { name: 'queue/index', label: 'Consultas', icon: 'stethoscope', iconFocused: 'stethoscope' },
  { name: 'chat/index', label: 'Chat', icon: 'chat-processing-outline', iconFocused: 'chat-processing' },
  { name: 'history/index', label: 'Historial', icon: 'clipboard-text-outline', iconFocused: 'clipboard-text' },
];

function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xs }}>
      <MaterialCommunityIcons name={icon} size={24} color={focused ? c.primary : c.inkMuted} />
      {focused && <View style={{ width: 20, height: 3, backgroundColor: c.primary, borderRadius: radius.full, marginTop: 3 }} />}
    </View>
  );
}

function HeaderRight() {
  const { colors: c } = useTheme();
  const { user, logout } = useAuth();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm }}>
      <Pressable
        onPress={() => logout()}
        style={{ width: 48, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        accessibilityHint="Presioná para cerrar tu sesión actual"
      >
        <MaterialCommunityIcons
          name="logout-variant"
          size={24}
          color="red"
        />
      </Pressable>
      <View style={{ width: 48, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Avatar
          name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          size={32}
        />
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  usePushToken(Boolean(user));

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTitleStyle: { color: c.ink, fontWeight: fontWeights.bold, fontSize: fontSizes.subtitle, letterSpacing: -0.3 },
        headerTintColor: c.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 56 + insets.bottom : 64,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          paddingHorizontal: spacing.sm,
        },
        tabBarLabelStyle: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, marginTop: 0 },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            headerTitle: tab.name === 'index' ? 'VetConnect' : tab.label,
            tabBarIcon: ({ focused }) => <TabIcon icon={focused ? tab.iconFocused : tab.icon} focused={focused} />,
            tabBarAccessibilityLabel: `${tab.label} ${tab.name === 'index' ? '— pantalla principal' : ''}`,
          }}
        />
      ))}
      <Tabs.Screen name="pets/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="pets/new" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="chat/[consultationId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
