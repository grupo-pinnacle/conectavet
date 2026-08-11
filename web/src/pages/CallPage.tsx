import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const CallRoom = lazy(() => import("../components/call/CallRoom"));

/**
 * Página pública de videollamada.
 * La usa el WebView del mobile: recibe url/room/token por query string
 * (token de corta duración, emitido por el backend para la consulta).
 */
export default function CallPage() {
  const [params] = useSearchParams();
  const url = params.get("url") || "";
  const room = params.get("room") || "";
  const token = params.get("token") || "";

  if (!url || !room || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="max-w-sm rounded-xl bg-white/10 p-8 text-center">
          <p className="text-lg font-bold text-white">Llamada inválida</p>
          <p className="mt-2 text-sm text-slate-300">
            El enlace de videollamada es incorrecto o expiró. Volvé a iniciar la llamada desde el chat.
          </p>
        </div>
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
        call={{ url, room, token, expiresIn: 600 }}
        peerName="el otro participante"
        onLeave={() => {
          window.location.href = "vetconnect://call-ended";
        }}
      />
    </Suspense>
  );
}
