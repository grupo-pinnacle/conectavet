import { useState, useEffect } from "react";
import VideoCallRoom from "../VideoCallRoom";
import { PawPrint } from "lucide-react";

interface WaitingRoomProps {
  onBack: () => void;
}

export default function WaitingRoom({ onBack }: WaitingRoomProps) {
  const [seconds, setSeconds] = useState(30);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (inCall) {
    return <VideoCallRoom onEndCall={() => setInCall(false)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-10 shadow-sm">
      <div className="mb-6">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-teal-50"><PawPrint className="h-16 w-16 text-teal-700" /></div>
      </div>
      <p className="text-2xl font-bold text-ink">Sala de espera</p>
      <p className="mb-2 text-slate-500">Veterinario Asignado</p>
      <p className="mb-6 text-xl font-bold text-teal-700">Dr. Martín Lopez</p>
      <div className="mb-6 text-center">
        <p className="text-sm text-slate-500">Tiempo Estimado</p>
        <p className="text-4xl font-bold text-ink">
          {String(minutes).padStart(2, "0")} : {String(secs).padStart(2, "0")}
        </p>
        <p className="text-xs text-slate-400">minutos</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setInCall(true)}
          className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Ingresar a la consulta
        </button>
        <button onClick={onBack} className="rounded-lg border border-border px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">
          Cancelar
        </button>
      </div>
    </div>
  );
}
