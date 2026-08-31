import { View, Text, Pressable } from "react-native";
import { usePathname, router } from "expo-router";
import { Platform } from "react-native";

const tabs = [
  { path: "/(app)", label: "Inicio", icon: "🏠" },
  { path: "/(app)/pets", label: "Mascotas", icon: "🐾" },
  { path: "/(app)/consultations", label: "Consultas", icon: "🩺" },
  { path: "/(app)/vet", label: "Vet", icon: "👨‍⚕️" },
];

export function TabBar() {
  const pathname = usePathname() || "";

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