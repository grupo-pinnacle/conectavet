import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { trpc } from "@/trpc/react";
import { Card, Avatar, Button } from "@/components/ui";
import { clearSession, getSession, type MobileSession } from "@/auth/session";

export default function ProfileScreen() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: !!session });

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-ink-soft">Cargando...</Text>
      </View>
    );
  }

  const role = (me as any)?.role || session.role;
  const firstName = (me as any)?.firstName || session.email.split("@")[0];
  const lastName = (me as any)?.lastName || "";

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-4">
        <Card className="items-center py-6">
          <Avatar name={`${firstName} ${lastName}`} email={session.email} size="xl" />
          <Text className="text-xl font-bold text-ink mt-3">{firstName} {lastName}</Text>
          <Text className="text-sm text-ink-soft">{session.email}</Text>
          <View className="mt-3 px-3 py-1 bg-brand-soft rounded-full">
            <Text className="text-brand text-xs font-semibold capitalize">{role.toLowerCase()}</Text>
          </View>
        </Card>

        <View className="mt-4 gap-3">
          <Card>
            <Text className="text-sm font-semibold text-ink-soft mb-2">Cuenta</Text>
            <Pressable className="py-2 border-b border-border">
              <Text className="text-ink">Editar perfil</Text>
            </Pressable>
            <Pressable className="py-2 border-b border-border">
              <Text className="text-ink">Cambiar contraseña</Text>
            </Pressable>
            <Pressable className="py-2">
              <Text className="text-ink">Notificaciones</Text>
            </Pressable>
          </Card>

          <Card>
            <Text className="text-sm font-semibold text-ink-soft mb-2">Soporte</Text>
            <Pressable className="py-2 border-b border-border">
              <Text className="text-ink">Ayuda</Text>
            </Pressable>
            <Pressable className="py-2 border-b border-border">
              <Text className="text-ink">Términos y condiciones</Text>
            </Pressable>
            <Pressable className="py-2">
              <Text className="text-ink">Política de privacidad</Text>
            </Pressable>
          </Card>

          <Pressable
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-lg p-3 items-center mt-2"
          >
            <Text className="text-red-700 font-medium">Cerrar sesión</Text>
          </Pressable>

          <Text className="text-center text-xs text-ink-soft mt-2">VetConnect v0.1.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}