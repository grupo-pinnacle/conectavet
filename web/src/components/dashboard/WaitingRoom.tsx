import { useState, useEffect } from "react";
import VideoCallRoom from "../VideoCallRoom";

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
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#CBD5E1] bg-white p-10 shadow-sm">
      <div className="mb-6">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 text-5xl">🐾</div>
      </div>
      <p className="text-2xl font-bold text-[#0F172A]">Sala de espera</p>
      <p className="mb-2 text-[#475569]">Veterinario Asignado</p>
      <p className="mb-6 text-xl font-bold text-[#2563EB]">Dr. Martín Lopez</p>
      <div className="mb-6 text-center">
        <p className="text-sm text-[#475569]">Tiempo Estimado</p>
        <p className="text-4xl font-bold text-[#0F172A]">
          {String(minutes).padStart(2, "0")} : {String(secs).padStart(2, "0")}
        </p>
        <p className="text-xs text-[#94A3B8]">minutos</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setInCall(true)}
          className="rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Ingresar a la consulta
        </button>
        <button onClick={onBack} className="rounded-lg border border-[#CBD5E1] px-6 py-3 text-sm font-bold text-[#475569] hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </div>
  );
}
