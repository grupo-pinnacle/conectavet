import { useState, useEffect, Suspense, lazy } from "react";
import { Video, Phone, PhoneOff, Loader2 } from "lucide-react";
import { getSocket, connectSocket } from "../../services/socket";
import { getCallToken, type CallToken } from "../../services/endpoints";

const CallRoom = lazy(() => import("./CallRoom"));

function playRingtone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return () => {};
    const ctx = new AudioContextClass();
    let isPlaying = true;

    const playChime = () => {
      if (!isPlaying || ctx.state === "closed") return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(554.37, now); // C#5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    };

    playChime();
    const interval = setInterval(playChime, 2400);

    return () => {
      isPlaying = false;
      clearInterval(interval);
      ctx.close().catch(() => {});
    };
  } catch {
    return () => {};
  }
}

export default function GlobalCallListener() {
  const [incomingCall, setIncomingCall] = useState<{ consultationId: string; callerName: string } | null>(null);
  const [call, setCall] = useState<CallToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (incomingCall) {
      const stopRingtone = playRingtone();
      return () => stopRingtone();
    }
  }, [incomingCall]);

  useEffect(() => {
    const sock = getSocket();
    const handleIncoming = (data: { consultationId: string; callerName: string }) => {
      if (!call && !loading) {
        setIncomingCall(data);
      }
    };
    const handleRejected = (data: { consultationId: string }) => {
      setIncomingCall((prev) => (prev?.consultationId === data.consultationId ? null : prev));
    };

    const attach = (s: any) => {
      s.on("call:incoming", handleIncoming);
      s.on("call:rejected", handleRejected);
    };

    if (sock) {
      attach(sock);
    } else {
      connectSocket().then(attach).catch(() => {});
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.off("call:incoming", handleIncoming);
        s.off("call:rejected", handleRejected);
      }
    };
  }, [call, loading]);

  const acceptCall = async () => {
    if (!incomingCall || loading) return;
    const consId = incomingCall.consultationId;
    setIncomingCall(null);
    setLoading(true);
    setError("");

    try {
      const data = await getCallToken(consId);
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

  const rejectCall = () => {
    if (incomingCall) {
      const s = getSocket();
      if (s) s.emit("call:reject", incomingCall.consultationId);
      setIncomingCall(null);
    }
  };

  return (
    <>
      {incomingCall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 animate-pulse">
                <Video className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Llamada entrante</h2>
            <p className="mb-8 text-slate-400 text-center">Videollamada de {incomingCall.callerName}</p>
            
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
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg animate-in slide-in-from-bottom-2">
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

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-400" />
            <p className="mt-3 text-sm font-semibold text-white">Conectando a la videollamada...</p>
          </div>
        </div>
      )}

      {call && (
        <div className="fixed inset-0 z-[100]">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center bg-slate-950">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            </div>
          }>
            <CallRoom
              call={call}
              peerName={"Veterinario/Cliente"}
              onLeave={() => setCall(null)}
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
