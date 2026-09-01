import { Stack, usePathname, router } from "expo-router";
import { View, Pressable, Text, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/react";
import { getSession, clearSession } from "@/auth/session";
import { Avatar } from "@/components/ui";

const HIDE_TABBAR_ROUTES = ["/(app)/consultations/[id]", "/(app)/pets/new", "/(app)/consultations/new"];

function TabBar({ role }: { role?: string }) {
  const pathname = usePathname() || "";
  const tabs = [
    { path: "/(app)", label: "Inicio", icon: "🏠" },
    { path: "/(app)/pets", label: "Mascotas", icon: "🐾" },
    { path: "/(app)/consultations", label: "Consultas", icon: "🩺" },
    ...(role === "VET" ? [{ path: "/(app)/vet", label: "Vet", icon: "👨‍⚕️" }] : []),
    { path: "/(app)/profile", label: "Perfil", icon: "👤" },
  ];

  return (
    <View className="flex-row bg-white border-t border-border pb-safe">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path !== "/(app)" && pathname.startsWith(tab.path));
        return (
          <Pressable
            key={tab.path}
            onPress={() => router.push(tab.path as any)}
            className="flex-1 items-center justify-center py-2 active:opacity-50"
          >
            <Text className={`text-2xl mb-0.5 ${isActive ? "" : "opacity-50"}`}>{tab.icon}</Text>
            <Text className={`text-xs ${isActive ? "text-brand font-medium" : "text-ink-soft"}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  const pathname = usePathname() || "";
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [role, setRole] = useState<string | undefined>();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: hasSession, retry: false });
  const showTabBar = !HIDE_TABBAR_ROUTES.some((r) => pathname.includes(r.split("/").pop() || ""));

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setHasSession(!!session?.token);
      setRole(session?.role);
      setChecking(false);
      if (!session?.token && !pathname.startsWith("/(app)/profile")) {
        router.replace("/(auth)/login");
      }
    })();
  }, []);

  useEffect(() => {
    if (meQuery.data) {
      setRole((meQuery.data as any).role);
    }
  }, [meQuery.data]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#1C60F0" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="consultations/index" />
        <Stack.Screen name="consultations/new" />
        <Stack.Screen name="consultations/[id]" />
        <Stack.Screen name="vet/index" />
        <Stack.Screen name="pets/index" />
        <Stack.Screen name="pets/new" />
        <Stack.Screen name="profile" />
      </Stack>
      {showTabBar && <TabBar role={role} />}
    </View>
  );
}