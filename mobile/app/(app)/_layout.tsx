import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';
import { useWebSocket } from '@/hooks/useWebSocket';

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 11,
          color: focused ? colors.primary : colors.inkMuted,
          fontWeight: focused ? '700' : '500',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function HeaderRight() {
  const { user, logout } = useAuth();
  return (
    <Pressable
      onPress={() => logout()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>
          {(user?.firstName?.[0] ?? '?').toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AppLayout() {
  // Open the queue WebSocket for the lifetime of the (app) group
  useWebSocket(true);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        headerTintColor: colors.primary,
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'VetConnect',
          tabBarIcon: ({ focused }) => <TabIcon label="Inicio" emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Mascotas',
          headerTitle: 'Mis mascotas',
          tabBarIcon: ({ focused }) => <TabIcon label="Mascotas" emoji="🐾" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat IA',
          headerTitle: 'Asistente IA',
          tabBarIcon: ({ focused }) => <TabIcon label="Chat" emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Cola',
          headerTitle: 'Cola de espera',
          tabBarIcon: ({ focused }) => <TabIcon label="Cola" emoji="⏳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          headerTitle: 'Consultas',
          tabBarIcon: ({ focused }) => <TabIcon label="Historial" emoji="📋" focused={focused} />,
        }}
      />
      {/* Hidden routes — rendered as full-screen pushes, not tabs */}
      <Tabs.Screen name="pets/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="pets/new" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="chat/[conversationId]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="call/[entryId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
