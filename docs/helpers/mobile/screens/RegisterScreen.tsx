import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

interface Props {
  navigation: any;
}

const ROLES = [
  { value: "CLIENT", label: "Dueño de mascota" },
  { value: "VET", label: "Veterinario" },
  { value: "ADMIN", label: "Administrador" },
];

export default function RegisterScreen({ navigation }: Props) {
  const { register: registerUser, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CLIENT");

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      await registerUser(email, password, role);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña (mín. 6 caracteres)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Tipo de usuario</Text>
          <View style={styles.roleGroup}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleOption, role === r.value && styles.roleSelected]}
                onPress={() => setRole(r.value)}
              >
                <Text style={[styles.roleText, role === r.value && styles.roleTextSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#5460c4", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: "#000" },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
  roleGroup: { flexDirection: "row", gap: 8, marginBottom: 24 },
  roleOption: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, alignItems: "center" },
  roleSelected: { borderColor: "#5460c4", backgroundColor: "#eef2ff" },
  roleText: { fontSize: 12, color: "#6b7280" },
  roleTextSelected: { color: "#5460c4", fontWeight: "600" },
  button: { backgroundColor: "#5460c4", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#5460c4", fontSize: 14 },
});
