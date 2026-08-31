import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6">
        <Text className="text-2xl font-bold text-ink mb-1">Hola 👋</Text>
        <Text className="text-ink-soft mb-6">¿Cómo podemos ayudar hoy?</Text>

        <View className="space-y-3">
          <Pressable
            onPress={() => router.push("/(app)/pets")}
            className="bg-white border border-border rounded-lg p-4 shadow-card active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-brand-soft items-center justify-center mr-3">
                <Text className="text-2xl">🐾</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">Mis mascotas</Text>
                <Text className="text-sm text-ink-soft">Gestioná su información</Text>
              </View>
              <Text className="text-ink-soft">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/consultations")}
            className="bg-white border border-border rounded-lg p-4 shadow-card active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-brand-soft items-center justify-center mr-3">
                <Text className="text-2xl">🩺</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">Mis consultas</Text>
                <Text className="text-sm text-ink-soft">Historial y activas</Text>
              </View>
              <Text className="text-ink-soft">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/consultations/new")}
            className="bg-brand rounded-lg p-4 shadow-elevated active:opacity-80"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-white/20 items-center justify-center mr-3">
                <Text className="text-2xl">➕</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">Nueva consulta</Text>
                <Text className="text-sm text-white/80">Solicitá una videollamada</Text>
              </View>
              <Text className="text-white">›</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}