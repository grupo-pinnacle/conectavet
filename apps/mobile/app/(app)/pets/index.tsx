import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { router } from "expo-router";

const mockPets = [
  { id: "1", name: "Max", species: "Perro", breed: "Golden Retriever", age: 4, photoUrl: null },
  { id: "2", name: "Luna", species: "Gato", breed: "Siamés", age: 2, photoUrl: null },
];

export default function PetsScreen() {
  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-ink">Mis mascotas</Text>
            <Text className="text-ink-soft">{mockPets.length} registradas</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/pets/new")}
            className="bg-brand px-4 py-2 rounded-md"
          >
            <Text className="text-white font-medium">+ Agregar</Text>
          </Pressable>
        </View>

        {mockPets.length === 0 ? (
          <View className="bg-white border border-border rounded-lg p-8 items-center">
            <Text className="text-5xl mb-3">🐾</Text>
            <Text className="text-lg font-semibold text-ink mb-1">No tenés mascotas</Text>
            <Text className="text-ink-soft text-center mb-4">Agregá la primera para empezar</Text>
            <Pressable
              onPress={() => router.push("/(app)/pets/new")}
              className="bg-brand px-6 py-2 rounded-md"
            >
              <Text className="text-white font-medium">+ Agregar mascota</Text>
            </Pressable>
          </View>
        ) : (
          <View className="space-y-3">
            {mockPets.map((pet) => (
              <View key={pet.id} className="bg-white border border-border rounded-lg p-4 shadow-card">
                <View className="flex-row">
                  <View className="w-20 h-20 rounded-md bg-surface items-center justify-center mr-3">
                    {pet.photoUrl ? (
                      <Image source={{ uri: pet.photoUrl }} className="w-full h-full rounded-md" />
                    ) : (
                      <Text className="text-4xl">🐾</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-ink">{pet.name}</Text>
                    <Text className="text-sm text-ink-soft">{pet.species} · {pet.breed}</Text>
                    <Text className="text-xs text-ink-soft mt-1">🎂 {pet.age} años</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => router.push(`/(app)/consultations/new?petId=${pet.id}`)}
                    className="flex-1 bg-brand py-2 rounded-md items-center"
                  >
                    <Text className="text-white font-medium text-sm">Consultar</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-surface py-2 rounded-md items-center">
                    <Text className="text-ink font-medium text-sm">Editar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}