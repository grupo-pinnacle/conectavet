import { Slot } from "expo-router";
import { Providers } from "@/trpc/provider";
import "../global.css";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <Providers>
      <View style={styles.container}>
        <Slot />
      </View>
    </Providers>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
});