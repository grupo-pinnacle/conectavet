"use client";

import { format } from "date-fns";
import { Avatar } from "./Avatar";

export interface MessageBubbleProps {
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string;
  senderName: string;
  senderAvatar?: string | null;
  isOwn: boolean;
  timestamp: Date | string;
  showAvatar?: boolean;
}

export function MessageBubble({ content, attachmentUrl, attachmentName, senderName, senderAvatar, isOwn, timestamp, showAvatar = true }: MessageBubbleProps) {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {showAvatar ? (
        <Avatar src={senderAvatar} alt={senderName} name={senderName} size="sm" />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && showAvatar && <span className="text-xs text-ink-soft mb-0.5 px-1">{senderName}</span>}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-brand text-white rounded-br-md"
              : "bg-surface text-ink rounded-bl-md border border-border"
          }`}
        >
          {content && <p className="whitespace-pre-wrap break-words">{content}</p>}
          {attachmentUrl && (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
              {attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={attachmentUrl} alt={attachmentName || "Adjunto"} className="max-w-[240px] rounded-md" />
              ) : (
                <span className={cn("text-sm underline", isOwn ? "text-white" : "text-brand")}>
                  📎 {attachmentName || "Ver adjunto"}
                </span>
              )}
            </a>
          )}
        </div>
        <span className={`text-[10px] text-ink-soft/70 mt-0.5 px-1 ${isOwn ? "text-right" : "text-left"}`}>
          {format(date, "HH:mm")}
        </span>
      </div>
    </div>
  );
}

function cn(...c: Array<string | undefined | false | null>) { return c.filter(Boolean).join(" "); }