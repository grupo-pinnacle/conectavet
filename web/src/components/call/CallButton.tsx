import { lazy, Suspense, useState, useEffect } from "react";
import { Video, Loader2, Phone, PhoneOff } from "lucide-react";
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
  const [incomingCall, setIncomingCall] = useState<{ callerName: string } | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (data: { consultationId: string; callerName: string }) => {
      if (data.consultationId === consultationId && !call && !loading) {
        setIncomingCall({ callerName: data.callerName });
      }
    };
    const onRejected = (data: { consultationId: string }) => {
      if (data.consultationId === consultationId) {
        // Maybe close PreJoin if they rejected? For now just dismiss any ringing
        setIncomingCall(null);
      }
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:rejected", onRejected);
    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:rejected", onRejected);
    };
  }, [consultationId, call, loading]);

  const startCall = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const socket = getSocket();
    if (socket) {
      socket.emit("call:initiate", consultationId, "Tu veterinario/cliente"); // Wait, we don't have our own name easily, but peerName is the OTHER guy. We'll just emit.
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

  const acceptCall = () => {
    setIncomingCall(null);
    startCall();
  };

  const rejectCall = () => {
    setIncomingCall(null);
    const socket = getSocket();
    if (socket) {
      socket.emit("call:reject", consultationId);
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

      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 animate-pulse">
                <Video className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Llamada entrante</h2>
            <p className="mb-8 text-slate-400 text-center">Videollamada de {peerName}</p>
            
            <div className="flex gap-6">
              <button
                onClick={rejectCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
                  <PhoneOff className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-400">Rechazar</span>
              </button>
              
              <button
                onClick={acceptCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors animate-bounce">
                  <Phone className="h-6 w-6 fill-current" />
                </div>
                <span className="text-xs font-semibold text-slate-400">Aceptar</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
