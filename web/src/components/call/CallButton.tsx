import { lazy, Suspense, useState } from "react";
import { Video, Loader2 } from "lucide-react";
import { getCallToken, type CallToken } from "../../services/endpoints";
import { getSocket } from "../../services/socket";

const CallRoom = lazy(() => import("./CallRoom"));

interface CallButtonProps {
  consultationId: string;
  peerName: string;
  disabled?: boolean;
}

export default function CallButton({ consultationId, peerName, disabled }: CallButtonProps) {
  const [call, setCall] = useState<CallToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCall = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const socket = getSocket();
    if (socket) {
      socket.emit("call:initiate", consultationId, "Tu veterinario/cliente");
    }
    try {
      const data = await getCallToken(consultationId);
      setCall(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error?.response?.data?.message ||
        (err instanceof Error ? err.message : "") ||
        "No pudimos iniciar la llamada."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={startCall}
        disabled={disabled || loading}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "bg-teal-700 text-white hover:bg-teal-800"
        }`}
        aria-label="Iniciar videollamada"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Video className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Videollamada</span>
      </button>

      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">
          <p className="font-semibold">No se pudo iniciar la llamada</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 text-xs font-bold text-red-700 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {call && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-400" />
                <p className="mt-3 text-sm font-semibold text-white">Conectando a la videollamada...</p>
              </div>
            </div>
          }
        >
          <CallRoom
            call={call}
            peerName={peerName}
            onLeave={() => setCall(null)}
          />
        </Suspense>
      )}
    </>
  );
}
