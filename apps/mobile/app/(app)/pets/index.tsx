import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Card, Avatar, Button } from "@/components/ui";

export default function PetsScreen() {
  const utils = trpc.useUtils();
  const { data: pets, isLoading } = trpc.pets.list.useQuery();
  const deleteMutation = trpc.pets.remove.useMutation({
    onSuccess: () => utils.pets.list.invalidate(),
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar mascota", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id }),
      },
    ]);
  };

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
            <Text className="text-2xl font-bold text-ink">Mis mascotas</Text>
            <Text className="text-ink-soft text-sm">{pets?.length ?? 0} registradas</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/pets/new")}
            className="bg-brand px-3 py-2 rounded-md"
          >
            <Text className="text-white font-medium text-sm">+ Agregar</Text>
          </Pressable>
        </View>

        {pets?.length === 0 ? (
          <Card className="items-center py-8">
            <Text className="text-5xl mb-3">🐾</Text>
            <Text className="text-lg font-semibold text-ink mb-1">No tenés mascotas</Text>
            <Text className="text-ink-soft text-center mb-4 text-sm">Agregá la primera para empezar</Text>
            <Pressable
              onPress={() => router.push("/(app)/pets/new")}
              className="bg-brand px-5 py-2 rounded-md"
            >
              <Text className="text-white font-medium">+ Agregar mascota</Text>
            </Pressable>
          </Card>
        ) : (
          <View className="gap-3">
            {pets?.map((pet) => (
              <Card key={pet.id}>
                <View className="flex-row">
                  <View className="w-20 h-20 rounded-md bg-surface items-center justify-center mr-3 overflow-hidden">
                    {pet.photoUrl ? (
                      <Image source={{ uri: pet.photoUrl }} className="w-full h-full" />
                    ) : (
                      <Text className="text-4xl">🐾</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-ink">{pet.name}</Text>
                    <Text className="text-sm text-ink-soft">
                      {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
                    </Text>
                    <View className="mt-1 flex-row flex-wrap gap-2">
                      {pet.age != null && <Text className="text-xs text-ink-soft">🎂 {pet.age}a</Text>}
                      {pet.weight != null && <Text className="text-xs text-ink-soft">⚖️ {pet.weight}kg</Text>}
                      {pet.sex && (
                        <Text className="text-xs text-ink-soft">{pet.sex === "MALE" ? "♂" : "♀"}</Text>
                      )}
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => handleDelete(pet.id)}
                    className="flex-1 bg-surface py-2 rounded-md items-center"
                  >
                    <Text className="text-ink font-medium text-sm">Eliminar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/(app)/consultations/new?petId=${pet.id}` as any)}
                    className="flex-1 bg-brand py-2 rounded-md items-center"
                  >
                    <Text className="text-white font-medium text-sm">Consultar</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}