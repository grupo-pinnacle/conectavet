import { View, Text, TextInput, ScrollView, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui";

export default function NewConsultationScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const utils = trpc.useUtils();
  const { data: pets } = trpc.pets.list.useQuery();

  const [selectedPet, setSelectedPet] = useState<string>(petId || "");
  const [reason, setReason] = useState("");

  const createMutation = trpc.consultations.create.useMutation({
    onSuccess: () => {
      utils.consultations.mine.invalidate();
      Alert.alert("Consulta solicitada", "Buscaremos un veterinario disponible.", [
        { text: "OK", onPress: () => router.replace("/(app)/consultations") },
      ]);
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const onSubmit = () => {
    if (!selectedPet || !reason.trim()) {
      Alert.alert("Error", "Seleccioná una mascota y describí el motivo");
      return;
    }
    if (reason.trim().length < 10) {
      Alert.alert("Motivo muy corto", "Describí el motivo con al menos 10 caracteres");
      return;
    }
    createMutation.mutate({ petId: selectedPet, reason: reason.trim() });
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4">
      <Text className="text-2xl font-bold text-ink mb-2">Nueva consulta</Text>
      <Text className="text-ink-soft text-sm mb-6">Solicitá una videollamada con un veterinario</Text>

      <View className="gap-5">
        <View>
          <Text className="text-base font-semibold text-ink mb-3">¿Qué mascota necesita atención?</Text>
          {pets?.length === 0 ? (
            <View className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <Text className="text-amber-800 text-sm">No tenés mascotas registradas.</Text>
            </View>
          ) : (
            <View className="gap-2">
              {pets?.map((pet) => (
                <Pressable
                  key={pet.id}
                  onPress={() => setSelectedPet(pet.id)}
                  className={`p-3 rounded-md border ${
                    selectedPet === pet.id ? "bg-brand-soft border-brand" : "bg-white border-border"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedPet === pet.id ? "border-brand" : "border-border"
                    }`}>
                      {selectedPet === pet.id && <View className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-ink">{pet.name}</Text>
                      <Text className="text-sm text-ink-soft">{pet.species}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text className="text-base font-semibold text-ink mb-2">Motivo de la consulta</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Describí los síntomas, antecedentes, y qué necesitás..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink min-h-[120px]"
          />
        </View>

        <View className="flex-row gap-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-white border border-border py-3 rounded-md items-center"
          >
            <Text className="text-ink font-medium">Cancelar</Text>
          </Pressable>
          <View className="flex-1">
            <Button onPress={onSubmit} loading={createMutation.isPending} size="lg" className="w-full">
              Solicitar consulta
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}