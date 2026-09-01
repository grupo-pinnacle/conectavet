import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/Button";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"CLIENT" | "VET">("CLIENT");
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  const onSubmit = async () => {
    if (!email || password.length < 6) {
      Alert.alert("Error", "Email y contraseña (mín. 6 caracteres) son requeridos");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await registerMutation.mutateAsync({ email, password, role, firstName, lastName });
      Alert.alert(
        role === "VET" ? "¡Registro recibido!" : "¡Listo!",
        role === "VET"
          ? "Los veterinarios deben pasar por aprobación. Te avisaremos por email."
          : "Tu cuenta fue creada. Iniciá sesión.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="flex-1 justify-center px-6 py-12">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-ink mb-1">Crear cuenta</Text>
        <Text className="text-ink-soft">Unite a ConectaVet</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-ink-soft mb-2">Tipo de cuenta</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setRole("CLIENT")}
              className={`flex-1 py-3 rounded-md border items-center ${role === "CLIENT" ? "bg-brand border-brand" : "bg-white border-border"}`}
            >
              <Text className={`text-sm font-medium ${role === "CLIENT" ? "text-white" : "text-ink-soft"}`}>
                Dueño de mascota
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("VET")}
              className={`flex-1 py-3 rounded-md border items-center ${role === "VET" ? "bg-brand border-brand" : "bg-white border-border"}`}
            >
              <Text className={`text-sm font-medium ${role === "VET" ? "text-white" : "text-ink-soft"}`}>
                Veterinario
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink-soft mb-1.5">Nombre</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Juan"
              className="bg-white border border-border rounded-md px-3 py-3 text-ink"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-ink-soft mb-1.5">Apellido</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Pérez"
              className="bg-white border border-border rounded-md px-3 py-3 text-ink"
            />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-ink-soft mb-1.5">Confirmar contraseña</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repetí la contraseña"
            secureTextEntry
            className="bg-white border border-border rounded-md px-3 py-3 text-ink"
          />
        </View>

        <Button onPress={onSubmit} loading={loading} size="lg" className="mt-2">
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-center text-ink-soft">
            ¿Ya tenés cuenta? <Text className="text-brand font-medium">Iniciá sesión</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}