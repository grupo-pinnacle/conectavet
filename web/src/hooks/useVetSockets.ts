import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket } from "../services/socket";
import { useAuth } from "./useAuth";

export function useVetSockets(refreshCounts: () => void) {
  const { user, syncOnline } = useAuth();

  useEffect(() => {
    refreshCounts();
    if (!user?.id) return;

    let cancelled = false;
    let sock: Socket | null = null;

    connectSocket()
      .then((s) => {
        if (cancelled) return;
        sock = s;
        const onAvailability = (payload: { vetId: string; isOnline: boolean }) => {
          if (cancelled) return;
          if (payload.vetId === user.id) syncOnline(payload.isOnline);
        };
        s.on("vet:availability", onAvailability);
        s.on("consultation:new", refreshCounts);
        s.on("consultation:updated", refreshCounts);
        s.on("notification:new", refreshCounts);
      })
      .catch(() => {
        // Fallback
      });

    return () => {
      cancelled = true;
      sock?.off("vet:availability");
      sock?.off("consultation:new", refreshCounts);
      sock?.off("consultation:updated", refreshCounts);
      sock?.off("notification:new", refreshCounts);
    };
  }, [user?.id, syncOnline, refreshCounts]);
}
