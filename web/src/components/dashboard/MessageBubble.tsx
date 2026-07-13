import { memo } from "react";
import type { Message } from "../../types";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  return `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} ${time}`;
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

interface Props {
  message: Message;
  isOwn: boolean;
  senderLabel: string;
  showSender?: boolean;
  showDateSeparator?: boolean;
}

export const MessageBubble = memo(function MessageBubble({ message, isOwn, senderLabel, showSender = true, showDateSeparator = false }: Props) {
  const isOptimistic = message.id.startsWith("msg-");

  return (
    <>
      {showDateSeparator && (
        <div className="flex justify-center py-3">
          <span className="rounded-full bg-slate-100 px-4 py-1 text-[11px] font-semibold text-slate-500">
            {formatDateSeparator(message.createdAt)}
          </span>
        </div>
      )}
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] md:max-w-[68%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isOwn
              ? "bg-teal-700 text-white rounded-br-md"
              : "bg-[#F1F5F9] text-ink rounded-bl-md border border-[#E2E8F0]"
          }`}
        >
          {!isOwn && showSender && (
            <p className="text-[11px] font-semibold text-teal-600 mb-1">
              {senderLabel}
            </p>
          )}
          <p className="leading-6 whitespace-pre-wrap break-words">{message.content}</p>
          <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${isOwn ? "text-teal-200" : "text-slate-400"}`}>
            <span>{formatTime(message.createdAt)}</span>
            {isOwn && isOptimistic && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-teal-200" />
                <span>enviando</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
