import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "../services/socket";
import { notifyDataChanged } from "../services/realtime";
import { useAuth } from "./useAuth";

/**
 * Tiempo real global: conecta el socket una sola vez por sesión y, ante
 * eventos del backend, invalida las queries de React Query y avisa a las
 * secciones (pub/sub realtime) para que muestren datos frescos sin polling.
 */
const EVENTS_TO_KEYS: Record<string, string[]> = {
  "consultation:new": ["consultations"],
  "consultation:updated": ["consultations"],
  "prescription:new": ["consultations"],
  "notification:new": ["notifications"],
  "vet:availability": ["vets"],
  "pet:updated": ["pets"],
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let socket: Awaited<ReturnType<typeof connectSocket>> | null = null;
    const handlers: Array<[string, () => void]> = [];

    connectSocket()
      .then((s) => {
        if (cancelled) return;
        socket = s;
        for (const [event, keys] of Object.entries(EVENTS_TO_KEYS)) {
          const handler = () => {
            for (const key of keys) {
              queryClient.invalidateQueries({ queryKey: [key] });
            }
            notifyDataChanged();
          };
          handlers.push([event, handler]);
          s.on(event, handler);
        }
      })
      .catch(() => {
        // Sin socket seguimos con refetchOnWindowFocus como red de seguridad
      });

    return () => {
      cancelled = true;
      if (socket) {
        for (const [event, handler] of handlers) socket.off(event, handler);
      }
    };
  }, [isAuthenticated, queryClient]);
}
