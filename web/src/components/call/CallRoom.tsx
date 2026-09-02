import { useState } from "react";
import { VideoPresets } from "livekit-client";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  PreJoin,
} from "@livekit/components-react";
import "@livekit/components-styles";
import type { CallToken } from "../../services/endpoints";
import { Stethoscope, AlertTriangle } from "lucide-react";

interface CallRoomProps {
  call: CallToken;
  peerName: string;
  onLeave: () => void;
}

export default function CallRoom({ call, peerName, onLeave }: CallRoomProps) {
  const [preJoined, setPreJoined] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  if (!preJoined) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-slate-950 px-4 py-8 pb-32"
        style={{
          paddingBottom: "max(120px, env(safe-area-inset-bottom, 32px) + 80px)",
        }}
        data-lk-theme="default"
      >
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-white sm:text-2xl">Sala de Consulta</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Preparate para hablar con {peerName}</p>
        </div>

        {mediaError && (
          <div className="mb-4 flex w-full max-w-md items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <span>{mediaError}</span>
          </div>
        )}

        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10 mb-6">
          <PreJoin
            onSubmit={() => setPreJoined(true)}
            onValidate={() => true}
            onError={(err) => {
              console.error("LiveKit PreJoin error:", err);
              setMediaError("No pudimos acceder a tu cámara o micrófono. Verificá los permisos del dispositivo.");
            }}
          />
        </div>

        <button
          onClick={onLeave}
          className="rounded-full bg-slate-900 border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Volver al chat
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
      data-lk-theme="default"
      style={{
        paddingBottom: "max(24px, env(safe-area-inset-bottom, 16px))",
      }}
    >
      <style>{`
        .lk-control-bar {
          padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
          margin-bottom: 8px !important;
          z-index: 100 !important;
        }
        .lk-prejoin {
          padding-bottom: 24px !important;
        }
      `}</style>
      <LiveKitRoom
        video={true}
        audio={true}
        token={call.token}
        serverUrl={call.url}
        onDisconnected={onLeave}
        style={{ height: "100%", width: "100%" }}
        options={{
          adaptiveStream: { pixelDensity: 'screen' },
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h360,
            frameRate: 20,
          },
          publishDefaults: {
            videoEncoding: { maxBitrate: 400_000, maxFramerate: 20 },
            videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
          },
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
