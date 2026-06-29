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
} from "react-native";
import { AuthContext } from "../context/AuthContext";

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>VetConnect</Text>
        <Text style={styles.subtitle}>Iniciar sesión</Text>

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
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#5460c4", marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: "center", color: "#6b7280", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: "#000" },
  button: { backgroundColor: "#5460c4", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#5460c4", fontSize: 14 },
});
