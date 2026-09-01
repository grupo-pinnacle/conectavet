import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Card, Avatar, Button } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

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

const variantBg: Record<string, string> = {
  warning: "bg-amber-100",
  info: "bg-blue-100",
  success: "bg-green-100",
  neutral: "bg-gray-100",
  danger: "bg-red-100",
};

const variantText: Record<string, string> = {
  warning: "text-amber-800",
  info: "text-blue-800",
  success: "text-green-800",
  neutral: "text-gray-800",
  danger: "text-red-800",
};

export default function ConsultationsScreen() {
  const { data: consultations, isLoading } = trpc.consultations.mine.useQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1C60F0" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-ink">Mis consultas</Text>
            <Text className="text-ink-soft text-sm">{consultations?.length ?? 0} en total</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/consultations/new")}
            className="bg-brand px-3 py-2 rounded-md"
          >
            <Text className="text-white font-medium text-sm">+ Nueva</Text>
          </Pressable>
        </View>

        {consultations?.length === 0 ? (
          <Card className="items-center py-8">
            <Text className="text-5xl mb-3">🩺</Text>
            <Text className="text-lg font-semibold text-ink mb-1">Sin consultas</Text>
            <Text className="text-ink-soft text-center mb-4 text-sm">Solicitá tu primera consulta</Text>
            <Pressable
              onPress={() => router.push("/(app)/consultations/new")}
              className="bg-brand px-5 py-2 rounded-md"
            >
              <Text className="text-white font-medium">+ Nueva consulta</Text>
            </Pressable>
          </Card>
        ) : (
          <View className="gap-2">
            {consultations?.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/(app)/consultations/${c.id}` as any)}
                className="bg-white border border-border rounded-lg p-3 active:opacity-70"
              >
                <View className="flex-row items-center">
                  <Avatar src={c.pet?.photoUrl} name={c.pet?.name} size="md" />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-ink">{c.pet?.name}</Text>
                    <Text className="text-xs text-ink-soft">
                      {c.pet?.species} · {formatRelativeTime(c.createdAt)}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${variantBg[statusVariant[c.status] || "neutral"]}`}>
                    <Text className={`text-xs font-medium ${variantText[statusVariant[c.status] || "neutral"]}`}>
                      {statusLabel[c.status] || c.status}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}