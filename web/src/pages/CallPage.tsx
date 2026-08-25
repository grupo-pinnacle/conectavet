import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const CallRoom = lazy(() => import("../components/call/CallRoom"));

interface CallInit {
  url: string;
  room: string;
  token: string;
}

/**
 * Página pública de videollamada.
 * La usa el WebView del mobile. El token (corto y sensible) NO viaja en la
 * URL: el mobile lo envía por `postMessage` (`call:init`) tras cargar, para
 * que no quede en logs/proxy/historial. Como fallback sigue aceptando los
 * query params (uso en escritorio).
 */
export default function CallPage() {
  const [params] = useSearchParams();
  const [call, setCall] = useState<CallInit | null>(() => {
    const url = params.get("url") || "";
    const room = params.get("room") || "";
    const token = params.get("token") || "";
    return url && room && token ? { url, room, token } : null;
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data && data.type === "call:init" && data.url && data.room && data.token) {
          setCall({ url: data.url, room: data.room, token: data.token });
        }
      } catch {
        /* mensaje no relacionado */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!call) {
    const hasRoom = Boolean(params.get("room"));
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        {hasRoom ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        ) : (
          <div className="max-w-sm rounded-xl bg-white/10 p-8 text-center">
            <p className="text-lg font-bold text-white">Llamada inválida</p>
            <p className="mt-2 text-sm text-slate-300">
              El enlace de videollamada es incorrecto o expiró. Volvé a iniciar la llamada desde el chat.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <CallRoom
        call={{ ...call, expiresIn: 600 }}
        peerName="el otro participante"
        onLeave={() => {
          // Avisa al WebView del mobile (postMessage) para que cierre la llamada;
          // el fallback de deep link cubre el caso de escritorio.
          try {
            (window as unknown as { ReactNativeWebView?: { postMessage: (m: string) => void } })
              .ReactNativeWebView?.postMessage(JSON.stringify({ type: "call:ended" }));
          } catch {
            /* sin WebView */
          }
          window.location.href = "vetconnect://call-ended";
        }}
      />
    </Suspense>
  );
}
