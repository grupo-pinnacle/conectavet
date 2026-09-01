// Auth mobile — usa tRPC.auth.mobileLogin para obtener un JWT firmado.
// El JWT se guarda en SecureStore (o localStorage en web) y se manda
// como Authorization: Bearer <token> en cada request tRPC.
//
// El web valida el JWT en createTRPCContext y arma la sesión automáticamente.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_KEY = "conectavet.session";

export type MobileSession = {
  token: string;
  userId: string;
  email: string;
  role: "CLIENT" | "VET" | "ADMIN";
  vetStatus: "PENDING" | "APPROVED";
  tokenVersion: number;
};

function getStorage() {
  if (Platform.OS === "web") {
    return {
      getItem: async (k: string) => (typeof window !== "undefined" ? window.localStorage.getItem(k) : null),
      setItem: async (k: string, v: string) => {
        if (typeof window !== "undefined") window.localStorage.setItem(k, v);
      },
      removeItem: async (k: string) => {
        if (typeof window !== "undefined") window.localStorage.removeItem(k);
      },
    };
  }
  return {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
  };
}

export async function saveSession(session: MobileSession) {
  await getStorage().setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<MobileSession | null> {
  try {
    const value = await getStorage().getItem(SESSION_KEY);
    if (!value) return null;
    return JSON.parse(value) as MobileSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await getStorage().removeItem(SESSION_KEY);
}