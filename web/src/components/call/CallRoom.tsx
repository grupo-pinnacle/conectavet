import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteParticipant, type TrackPublication } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import type { CallToken } from "../../services/endpoints";

interface CallRoomProps {
  call: CallToken;
  peerName: string;
  onLeave: () => void;
}

export default function CallRoom({ call, peerName, onLeave }: CallRoomProps) {
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [, setVersion] = useState(0);
  const remoteRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  const attachRemoteTrack = useCallback((track: Track, participant: RemoteParticipant) => {
    const el = remoteRefs.current.get(participant.identity);
    if (el) track.attach(el);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const onParticipantConnected = (p: RemoteParticipant) => {
      setRemoteParticipants((prev) => (prev.some((x) => x.identity === p.identity) ? prev : [...prev, p]));
    };
    const onParticipantDisconnected = (p: RemoteParticipant) => {
      setRemoteParticipants((prev) => prev.filter((x) => x.identity !== p.identity));
    };
    const onTrackSubscribed = (track: Track, publication: TrackPublication, participant: RemoteParticipant) => {
      void publication;
      if (track.kind === "video") attachRemoteTrack(track, participant);
      setVersion((v) => v + 1);
    };
    const onTrackUnsubscribed = () => {
      setVersion((v) => v + 1);
    };

    room
      .connect(call.url, call.token, { autoSubscribe: true })
      .then(async () => {
        if (cancelled) return;
        setConnected(true);
        setError("");
        try { await room.localParticipant.setMicrophoneEnabled(true); } catch { /* sin micrófono */ }
        try { await room.localParticipant.setCameraEnabled(true); } catch { setCamOn(false); }
        timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No pudimos conectarnos a la videollamada.");
      });

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.Disconnected, () => {
      setConnected(false);
    });

    return () => {
      cancelled = true;
      window.clearInterval(timerRef.current);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.disconnect();
    };
  }, [room, call.url, call.token, attachRemoteTrack]);

  // Adjunta los tracks de video de los remotos cuando cambian (p. ej. al
  // llegar con la cámara ya encendida).
  useEffect(() => {
    remoteParticipants.forEach((p) => {
      p.getTrackPublications().forEach((pub) => {
        if (pub.track && pub.track.kind === "video") attachRemoteTrack(pub.track, p);
      });
    });
  }, [remoteParticipants, attachRemoteTrack]);

  // Cámara local: cuando se prende/apaga, adjuntar al elemento local.
  useEffect(() => {
    const pub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
    const track = pub?.track;
    if (track && track.kind === "video" && localVideoRef.current) {
      track.attach(localVideoRef.current);
    }
  }, [connected, camOn, room]);

  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    try { await room.localParticipant.setMicrophoneEnabled(next); } catch { /* ignore */ }
  };

  const toggleCam = async () => {
    const next = !camOn;
    setCamOn(next);
    try { await room.localParticipant.setCameraEnabled(next); } catch { /* ignore */ }
  };

  const leave = () => {
    room.disconnect();
    onLeave();
  };

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm font-bold text-white">Videollamada con {peerName}</p>
          <p className="text-xs text-slate-400">
            {connected ? `${mm}:${ss}` : "Conectando..."}
          </p>
        </div>
        <button
          onClick={leave}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          Terminar llamada
        </button>
      </div>

      {/* Video area */}
      <div className="relative flex flex-1 items-center justify-center bg-slate-900 p-4">
        {error ? (
          <div className="max-w-md rounded-xl bg-white/10 p-8 text-center">
            <p className="text-red-300 font-semibold">No se pudo iniciar la llamada</p>
            <p className="mt-2 text-sm text-slate-300">{error}</p>
            <button
              onClick={leave}
              className="mt-5 rounded-lg bg-white/20 px-5 py-2 text-sm font-bold text-white hover:bg-white/30"
            >
              Cerrar
            </button>
          </div>
        ) : remoteParticipants.length === 0 && connected ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-40" />
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
              </span>
            </div>
            <p className="text-lg font-bold text-white">Esperando a {peerName}…</p>
            <p className="mt-1 text-sm text-slate-400">Cuando se una, van a poder verse.</p>
          </div>
        ) : (
          <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2">
            {remoteParticipants.map((p) => (
              <div key={p.identity} className="relative overflow-hidden rounded-2xl bg-slate-800">
                <video
                  ref={(el) => {
                    if (el) remoteRefs.current.set(p.identity, el);
                    else remoteRefs.current.delete(p.identity);
                  }}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                  {p.name || p.identity}
                </span>
              </div>
            ))}
            {remoteParticipants.length === 0 && (
              <div className="flex items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                Cámara del otro lado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local video */}
      <div className="absolute bottom-24 right-4 z-10 h-36 w-28 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-800">
        <video
          ref={localVideoRef}
          className="h-full w-full scale-x-[-1] object-cover"
          autoPlay
          playsInline
          muted
        />
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
          Vos
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-8 pt-4">
        <button
          onClick={toggleMic}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            micOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-red-600 text-white"
          }`}
          aria-label={micOn ? "Silenciar micrófono" : "Activar micrófono"}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>
        <button
          onClick={toggleCam}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            camOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-red-600 text-white"
          }`}
          aria-label={camOn ? "Apagar cámara" : "Encender cámara"}
        >
          {camOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>
        <button
          onClick={leave}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
          aria-label="Colgar"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
