import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [call, setCall] = useState<CallInit | null>(() => {
    const url = params.get("url") || "";
    const room = params.get("room") || "";
    const token = params.get("token") || "";
    return url && room && token ? { url, room, token } : null;
  });

  useEffect(() => {
    const isValidCallData = (data: any): data is CallInit => {
      if (!data || data.type !== "call:init") return false;
      if (typeof data.url !== "string" || !/^(wss?|https?):\/\//i.test(data.url)) return false;
      if (typeof data.room !== "string" || !data.room.trim()) return false;
      if (typeof data.token !== "string" || data.token.length < 10) return false;
      return true;
    };

    const onMessage = (e: MessageEvent | Event) => {
      try {
        const eventData = (e as MessageEvent).data || (e as any).data;
        const data = typeof eventData === "string" ? JSON.parse(eventData) : eventData;
        if (isValidCallData(data)) {
          setCall({ url: data.url, room: data.room, token: data.token });
        }
      } catch {
        /* mensaje no relacionado */
      }
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("message", onMessage as EventListener);
    
    // Hook global para que injectJavaScript pueda llamarlo directamente si falla el postMessage nativo
    (window as any).__onCallInit = (data: any) => {
      if (isValidCallData(data)) {
        setCall({ url: data.url, room: data.room, token: data.token });
      }
    };

    // Notificar al contenedor nativo (WebView) que la SPA está montada y lista para recibir el token
    try {
      (window as unknown as { ReactNativeWebView?: { postMessage: (m: string) => void } })
        .ReactNativeWebView?.postMessage(JSON.stringify({ type: "page:ready" }));
    } catch {
      /* sin WebView */
    }

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("message", onMessage as EventListener);
      delete (window as any).__onCallInit;
    };
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
          const isReactNative = Boolean(
            (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView
          );
          if (isReactNative) {
            try {
              (window as unknown as { ReactNativeWebView: { postMessage: (m: string) => void } })
                .ReactNativeWebView.postMessage(JSON.stringify({ type: "call:ended" }));
            } catch {
              /* fallback */
            }
            setTimeout(() => {
              window.location.href = "vetconnect://call-ended";
            }, 50);
          } else {
            // En escritorio web redirigir limpiamente
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/dashboard");
            }
          }
        }}
      />
    </Suspense>
  );
}
