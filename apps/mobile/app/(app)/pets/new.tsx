import { View, Text, TextInput, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button, Card } from "@/components/ui";

export default function NewPetScreen() {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState<"MALE" | "FEMALE" | "">("");

  const createMutation = trpc.pets.create.useMutation({
    onSuccess: () => {
      utils.pets.list.invalidate();
      Alert.alert("Éxito", "Mascota guardada", [{ text: "OK", onPress: () => router.back() }]);
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const onSave = () => {
    if (!name || !species) {
      Alert.alert("Error", "Nombre y especie son obligatorios");
      return;
    }
    const payload: any = { name, species };
    if (breed) payload.breed = breed;
    if (age) payload.age = parseInt(age, 10);
    if (weight) payload.weight = parseFloat(weight);
    if (sex) payload.sex = sex;
    createMutation.mutate(payload);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4">
      <Text className="text-2xl font-bold text-ink mb-2">Nueva mascota</Text>
      <Text className="text-ink-soft text-sm mb-6">Sumá un compañero a tu familia</Text>

      <View className="gap-4">
        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Nombre *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Max"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-2">Especie *</Text>
          <View className="flex-row gap-2">
            {["Perro", "Gato", "Otro"].map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpecies(s)}
                className={`flex-1 py-3 rounded-md border items-center ${
                  species === s ? "bg-brand border-brand" : "bg-white border-border"
                }`}
              >
                <Text className={`font-medium ${species === s ? "text-white" : "text-ink-soft"}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Raza</Text>
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="Ej: Golden Retriever"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink-soft mb-1.5">Edad (años)</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="0"
              keyboardType="numeric"
              className="bg-white border border-border rounded-md px-3 py-3 text-ink"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink-soft mb-1.5">Peso (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="0.0"
              keyboardType="numeric"
              className="bg-white border border-border rounded-md px-3 py-3 text-ink"
            />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-2">Sexo</Text>
          <View className="flex-row gap-2">
            {[
              { value: "MALE", label: "Macho" },
              { value: "FEMALE", label: "Hembra" },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSex(opt.value as any)}
                className={`flex-1 py-2.5 rounded-md border items-center ${
                  sex === opt.value ? "bg-brand border-brand" : "bg-white border-border"
                }`}
              >
                <Text className={`font-medium text-sm ${sex === opt.value ? "text-white" : "text-ink-soft"}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row gap-3 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-white border border-border py-3 rounded-md items-center"
          >
            <Text className="text-ink font-medium">Cancelar</Text>
          </Pressable>
          <View className="flex-1">
            <Button onPress={onSave} loading={createMutation.isPending} size="lg" className="w-full">
              Guardar
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}