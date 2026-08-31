import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";

const mockQueue = [
  { id: "1", petName: "Max", species: "Perro", reason: "Vómitos desde ayer", waitTime: "2 min" },
  { id: "2", petName: "Luna", species: "Gato", reason: "Cojea pata trasera", waitTime: "5 min" },
];

const mockActive = [
  { id: "3", petName: "Rocky", species: "Perro", clientName: "Juan Pérez" },
];

export default function VetDashboard() {
  const handleTake = (id: string) => {
    Alert.alert("Consulta tomada", "Redirigiendo al chat...");
    setTimeout(() => router.push(`/(app)/consultations/${id}`), 500);
  };

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6">
        <Text className="text-2xl font-bold text-ink mb-1">Panel veterinario</Text>
        <Text className="text-ink-soft mb-6">Tu cola de consultas</Text>

        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-amber-50 border border-amber-200 rounded-md p-3">
            <Text className="text-2xl font-bold text-amber-800">{mockQueue.length}</Text>
            <Text className="text-xs text-amber-700">En cola</Text>
          </View>
          <View className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
            <Text className="text-2xl font-bold text-green-800">{mockActive.length}</Text>
            <Text className="text-xs text-green-700">En curso</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-ink mb-3">Cola de espera</Text>
          {mockQueue.length === 0 ? (
            <View className="bg-surface rounded-md p-6 items-center">
              <Text className="text-ink-soft">No hay consultas en espera</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {mockQueue.map((c) => (
                <View key={c.id} className="bg-white border border-border rounded-lg p-4 shadow-card">
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-md bg-surface items-center justify-center mr-3">
                      <Text className="text-2xl">🐾</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink">{c.petName}</Text>
                      <Text className="text-sm text-ink-soft">{c.species} · {c.reason}</Text>
                    </View>
                    <View className="px-2 py-1 rounded-full bg-amber-100">
                      <Text className="text-xs font-medium text-amber-800">{c.waitTime}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleTake(c.id)}
                    className="bg-brand py-2 rounded-md items-center"
                  >
                    <Text className="text-white font-medium">Tomar consulta</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text className="text-lg font-semibold text-ink mb-3">En curso</Text>
          {mockActive.length === 0 ? (
            <View className="bg-surface rounded-md p-6 items-center">
              <Text className="text-ink-soft">No tenés consultas activas</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {mockActive.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(app)/consultations/${c.id}`)}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-md bg-white items-center justify-center mr-3">
                      <Text className="text-2xl">🐾</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink">{c.petName}</Text>
                      <Text className="text-sm text-ink-soft">{c.clientName}</Text>
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