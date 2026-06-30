import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const getTitle = () => {
    switch (user.role) {
      case "VET": return "Panel del Médico";
      case "ADMIN": return "Panel de Administración";
      default: return "Mis Mascotas";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.placeholder}>
          {user.role === "CLIENT" && "Próximamente: gestión de mascotas y consultas"}
          {user.role === "VET" && "Próximamente: consultas asignadas y videollamada"}
          {user.role === "ADMIN" && "Próximamente: panel de administración"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111" },
  email: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  logoutBtn: { backgroundColor: "#ef4444", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  placeholder: { textAlign: "center", color: "#9ca3af", fontSize: 14, lineHeight: 20 },
});
