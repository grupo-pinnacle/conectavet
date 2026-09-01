import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Card, Avatar, Button } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export default function VetDashboard() {
  const { data: session } = trpc.auth.me.useQuery();
  const { data: queue } = trpc.consultations.queue.useQuery(undefined, { refetchInterval: 10000 });
  const { data: active } = trpc.consultations.active.useQuery(undefined, { refetchInterval: 5000 });

  const isApproved = (session as any)?.vetStatus === "APPROVED";
  const isVet = (session as any)?.role === "VET";

  if (!isVet) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Card className="items-center">
          <Text className="text-2xl mb-2">⏳</Text>
          <Text className="text-base font-semibold text-ink">Acceso solo para veterinarios</Text>
        </Card>
      </View>
    );
  }

  if (!isApproved) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Card className="items-center">
          <Text className="text-4xl mb-3">⏳</Text>
          <Text className="text-lg font-semibold text-ink mb-2">Cuenta pendiente de aprobación</Text>
          <Text className="text-ink-soft text-center text-sm">
            Un administrador revisará tu registro. Te avisaremos por email cuando esté activa.
          </Text>
        </Card>
      </View>
    );
  }

  const handleTake = (id: string) => {
    Alert.alert("Consulta tomada", "Redirigiendo al chat...");
    setTimeout(() => router.push(`/(app)/consultations/${id}` as any), 500);
  };

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-4">
        <Text className="text-2xl font-bold text-ink mb-1">Panel veterinario</Text>
        <Text className="text-ink-soft text-sm mb-4">Tu cola de consultas</Text>

        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-amber-50 border border-amber-200 rounded-md p-3">
            <Text className="text-2xl font-bold text-amber-800">{queue?.length ?? 0}</Text>
            <Text className="text-xs text-amber-700">En cola</Text>
          </View>
          <View className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
            <Text className="text-2xl font-bold text-green-800">{active?.length ?? 0}</Text>
            <Text className="text-xs text-green-700">En curso</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-ink mb-3">Cola de espera</Text>
          {!queue || queue.length === 0 ? (
            <View className="bg-surface rounded-md p-6 items-center">
              <Text className="text-ink-soft">No hay consultas en espera</Text>
            </View>
          ) : (
            <View className="gap-3">
              {queue.map((c) => (
                <Card key={c.id}>
                  <View className="flex-row items-center mb-3">
                    <Avatar src={c.pet?.photoUrl} name={c.pet?.name} size="md" />
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-semibold text-ink">{c.pet?.name}</Text>
                      <Text className="text-xs text-ink-soft">
                        {c.pet?.species} · {c.reason?.slice(0, 40) || "Sin motivo"}
                      </Text>
                      <Text className="text-[10px] text-ink-soft/70 mt-0.5">
                        {formatRelativeTime(c.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleTake(c.id)}
                    className="bg-brand py-2 rounded-md items-center"
                  >
                    <Text className="text-white font-medium">Tomar consulta</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text className="text-lg font-semibold text-ink mb-3">En curso</Text>
          {!active || active.length === 0 ? (
            <View className="bg-surface rounded-md p-6 items-center">
              <Text className="text-ink-soft">No tenés consultas activas</Text>
            </View>
          ) : (
            <View className="gap-3">
              {active.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(app)/consultations/${c.id}` as any)}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Avatar src={c.pet?.photoUrl} name={c.pet?.name} size="md" />
                    <View className="flex-1 ml-3">
                      <Text className="font-medium text-ink">{c.pet?.name}</Text>
                      <Text className="text-xs text-ink-soft">{c.client?.firstName} {c.client?.lastName}</Text>
                    </View>
                    <Text className="text-green-700">›</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}