import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { TabBar } from "@/components/layout/TabBar";

const HIDE_TABBAR_ROUTES = ["/(app)/consultations/[id]", "/(app)/pets/new", "/(app)/consultations/new"];

export default function AppLayout() {
  const pathname = usePathname() || "";
  const showTabBar = !HIDE_TABBAR_ROUTES.some((r) => pathname.includes(r.split("/").pop() || ""));

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
      </Stack>
      {showTabBar && <TabBar />}
    </View>
  );
}