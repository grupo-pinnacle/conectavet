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
import { Stethoscope } from "lucide-react";

interface CallRoomProps {
  call: CallToken;
  peerName: string;
  onLeave: () => void;
}

export default function CallRoom({ call, peerName, onLeave }: CallRoomProps) {
  const [preJoined, setPreJoined] = useState(false);

  if (!preJoined) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950" data-lk-theme="default">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Sala de Consulta</h1>
          <p className="mt-2 text-slate-400">Preparate para hablar con {peerName}</p>
        </div>
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
          <PreJoin
            onSubmit={() => setPreJoined(true)}
            onValidate={() => true}
            onError={(err) => console.error(err)}
          />
        </div>
        <button
          onClick={onLeave}
          className="mt-8 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Volver al chat
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={call.token}
        serverUrl={call.url}
        onDisconnected={onLeave}
        style={{ height: "100dvh", width: "100vw" }}
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
