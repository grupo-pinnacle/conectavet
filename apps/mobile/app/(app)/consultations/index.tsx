import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";

const mockConsultations = [
  { id: "1", petName: "Max", petSpecies: "Perro", status: "WAITING", createdAt: "hace 2 min" },
  { id: "2", petName: "Luna", petSpecies: "Gato", status: "ACTIVE", createdAt: "hace 1 h" },
  { id: "3", petName: "Max", petSpecies: "Perro", status: "COMPLETED", createdAt: "hace 2 días" },
];

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  WAITING: { label: "Esperando", bg: "bg-amber-100", text: "text-amber-800" },
  PENDING: { label: "Pendiente", bg: "bg-blue-100", text: "text-blue-800" },
  ACTIVE: { label: "En curso", bg: "bg-green-100", text: "text-green-800" },
  COMPLETED: { label: "Completada", bg: "bg-gray-100", text: "text-gray-800" },
  CANCELLED: { label: "Cancelada", bg: "bg-red-100", text: "text-red-800" },
};

export default function ConsultationsScreen() {
  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-ink">Mis consultas</Text>
            <Text className="text-ink-soft">{mockConsultations.length} en total</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/consultations/new")}
            className="bg-brand px-4 py-2 rounded-md"
          >
            <Text className="text-white font-medium">+ Nueva</Text>
          </Pressable>
        </View>

        {mockConsultations.length === 0 ? (
          <View className="bg-white border border-border rounded-lg p-8 items-center">
            <Text className="text-5xl mb-3">🩺</Text>
            <Text className="text-lg font-semibold text-ink mb-1">Sin consultas</Text>
            <Text className="text-ink-soft text-center mb-4">Solicitá tu primera consulta</Text>
            <Pressable
              onPress={() => router.push("/(app)/consultations/new")}
              className="bg-brand px-6 py-2 rounded-md"
            >
              <Text className="text-white font-medium">+ Nueva consulta</Text>
            </Pressable>
          </View>
        ) : (
          <View className="space-y-3">
            {mockConsultations.map((c) => {
              const s = statusConfig[c.status];
              return (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(app)/consultations/${c.id}`)}
                  className="bg-white border border-border rounded-lg p-4 shadow-card active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-md bg-surface items-center justify-center mr-3">
                      <Text className="text-3xl">🐾</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink">{c.petName}</Text>
                      <Text className="text-sm text-ink-soft">{c.petSpecies}</Text>
                      <Text className="text-xs text-ink-soft/70 mt-0.5">{c.createdAt}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${s.bg}`}>
                      <Text className={`text-xs font-medium ${s.text}`}>{s.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}