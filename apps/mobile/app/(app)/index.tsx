import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Avatar, Button } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import { getSession, clearSession } from "@/auth/session";

const statusVariant: Record<string, "warning" | "info" | "success" | "neutral" | "danger"> = {
  WAITING: "warning",
  PENDING: "info",
  ACTIVE: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

const statusLabel: Record<string, string> = {
  WAITING: "Esperando",
  PENDING: "Pendiente",
  ACTIVE: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default function HomeScreen() {
  const { data: pets, isLoading: petsLoading } = trpc.pets.list.useQuery();
  const { data: consultations, isLoading: consLoading } = trpc.consultations.mine.useQuery();

  const active = (consultations ?? []).filter((c) => c.status === "ACTIVE").length;
  const waiting = (consultations ?? []).filter((c) => c.status === "WAITING").length;
  const completed = (consultations ?? []).filter((c) => c.status === "COMPLETED").length;

  const handleLogout = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-ink">Hola 👋</Text>
            <Text className="text-ink-soft text-sm">¿Cómo podemos ayudar hoy?</Text>
          </View>
          <Pressable onPress={handleLogout} className="px-3 py-1.5 bg-surface rounded-md">
            <Text className="text-xs text-ink-soft">Salir</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 mb-6">
          <StatCard label="Mascotas" value={pets?.length ?? 0} />
          <StatCard label="En curso" value={active} />
          <StatCard label="Esperando" value={waiting} />
        </View>

        <View className="gap-3">
          <Pressable
            onPress={() => router.push("/(app)/pets")}
            className="bg-white border border-border rounded-lg p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-brand-soft items-center justify-center mr-3">
                <Text className="text-2xl">🐾</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">Mis mascotas</Text>
                <Text className="text-xs text-ink-soft">Gestioná su información</Text>
              </View>
              <Text className="text-ink-soft">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/consultations")}
            className="bg-white border border-border rounded-lg p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-brand-soft items-center justify-center mr-3">
                <Text className="text-2xl">🩺</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">Mis consultas</Text>
                <Text className="text-xs text-ink-soft">Historial y activas</Text>
              </View>
              <Text className="text-ink-soft">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/consultations/new")}
            className="bg-brand rounded-lg p-4 shadow-md active:opacity-80"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-white/20 items-center justify-center mr-3">
                <Text className="text-2xl">➕</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">Nueva consulta</Text>
                <Text className="text-xs text-white/80">Solicitá una videollamada</Text>
              </View>
              <Text className="text-white">›</Text>
            </View>
          </Pressable>
        </View>

        {/* Consultas recientes */}
        {!consLoading && (consultations ?? []).length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-ink mb-3">Recientes</Text>
            <View className="gap-2">
              {(consultations ?? []).slice(0, 3).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(app)/consultations/${c.id}` as any)}
                  className="bg-white border border-border rounded-lg p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Avatar src={c.pet?.photoUrl} name={c.pet?.name} size="sm" />
                    <View className="flex-1 ml-3">
                      <Text className="font-medium text-ink">{c.pet?.name}</Text>
                      <Text className="text-xs text-ink-soft">{formatRelativeTime(c.createdAt)}</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full ${
                      c.status === "ACTIVE" ? "bg-green-100" :
                      c.status === "WAITING" ? "bg-amber-100" :
                      c.status === "COMPLETED" ? "bg-gray-100" : "bg-red-100"
                    }`}>
                      <Text className="text-xs">{statusLabel[c.status] || c.status}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}