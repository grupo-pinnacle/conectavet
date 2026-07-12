import { useState, useEffect, useRef } from "react";
import { User, Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { createLiveKitRoom, joinLiveKitRoom } from "../services/endpoints";

interface VideoCallRoomProps {
  roomName?: string;
  onEndCall: () => void;
}

export default function VideoCallRoom({ roomName: initialRoom, onEndCall }: VideoCallRoomProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!initialRoom) {
          await createLiveKitRoom();
        } else {
          await joinLiveKitRoom(initialRoom);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError(err?.message || "Error al conectar la videollamada");
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = muted; });
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = videoOff; });
      setVideoOff(!videoOff);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-10 shadow-subtle">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
        <p className="text-lg font-bold text-ink">Conectando videollamada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-10 shadow-subtle">
        <p className="mb-2 text-lg font-bold text-danger">Error</p>
        <p className="mb-4 text-sm text-slate-500">{error}</p>
        <button onClick={onEndCall} className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-bold text-white">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-black shadow-overlay">
      <div className="relative grid h-[500px] grid-rows-2 gap-2 p-2 md:h-[600px]">
        <div className="relative row-span-2 overflow-hidden rounded-lg bg-gray-900">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-700">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-bold text-white">Esperando al veterinario...</p>
                <p className="text-sm text-gray-400">La videollamada comenzará en breve</p>
              </div>
            </div>
          )}

          <div className="absolute right-4 top-4 h-32 w-44 overflow-hidden rounded-lg border-2 border-white shadow-lg">
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 bg-gray-900 px-4 py-4">
        <button
          onClick={toggleMute}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-fast ${
            muted ? "bg-danger text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={onEndCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white transition-all duration-fast hover:bg-danger-dark active:scale-90"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
        <button
          onClick={toggleVideo}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-fast ${
            videoOff ? "bg-danger text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
