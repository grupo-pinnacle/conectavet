import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completá email y contraseña");
      return;
    }
    setLoading(true);
    // Auth via tRPC → NextAuth (en una iteración posterior: integrar next-auth client mobile)
    setTimeout(() => {
      setLoading(false);
      router.replace("/(app)");
    }, 500);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="flex-1 justify-center px-6">
      <View className="items-center mb-10">
        <View className="w-20 h-20 rounded-full bg-brand items-center justify-center mb-4">
          <Text className="text-white text-3xl font-bold">🐾</Text>
        </View>
        <Text className="text-3xl font-bold text-ink mb-1">ConectaVet</Text>
        <Text className="text-ink-soft text-center">Telemedicina veterinaria</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <Button onPress={onSubmit} loading={loading} size="lg" className="mt-2">
          Iniciar sesión
        </Button>

        <Pressable onPress={() => router.push("/(auth)/register")} className="py-2">
          <Text className="text-center text-ink-soft">
            ¿No tenés cuenta? <Text className="text-brand font-medium">Registrate</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}