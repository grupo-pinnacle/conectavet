import { useState } from "react";
import { Paperclip } from "lucide-react";

const chats = [
  {
    id: 1,
    name: "Dr. Iván",
    specialty: "Cardiólogo Veterinario",
    avatar: "I",
    online: true,
    messages: [
      { sender: "vet", text: "Hola! ¿Cómo está Firulais hoy?" },
      { sender: "user", text: "Mejorando, gracias. Ya está comiendo." },
      { sender: "vet", text: "Me alegra mucho. Continúa con la medicación." },
      { sender: "user", text: "Sí, le estoy dando la Amoxicilina." },
      { sender: "vet", text: "Perfecto. En unos días debería estar completamente recuperado." },
    ],
  },
  {
    id: 2,
    name: "Dra. Sofía Ramirez",
    specialty: "Dermatóloga Veterinaria",
    avatar: "S",
    online: false,
    messages: [
      { sender: "vet", text: "Te confirmo la cita para el próximo martes." },
      { sender: "user", text: "Perfecto, gracias." },
    ],
  },
];

export default function MessagesSection() {
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [showList, setShowList] = useState(true);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      {/* Chat list */}
      <div className={`w-full shrink-0 border-r border-border md:w-72 ${showList ? "block" : "hidden md:block"}`}>
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-lg font-bold text-ink">Mensajes</h2>
        </div>
        <div className="overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => { setActiveChat(chat); setShowList(false); }}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-100 ${
                activeChat.id === chat.id && !showList ? "bg-teal-50" : ""
              }`}
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  {chat.avatar}
                </div>
                {chat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
                )}
              </div>
              <div className="flex-1 truncate">
                <p className="font-bold text-ink">{chat.name}</p>
                <p className="text-xs text-slate-500">{chat.specialty}</p>
                <p className="truncate text-sm text-slate-400">
                  {chat.messages[chat.messages.length - 1].text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      <div className={`flex flex-1 flex-col ${showList ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
          <button onClick={() => setShowList(true)} className="mr-1 text-lg md:hidden">←</button>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
              {activeChat.avatar}
            </div>
            {activeChat.online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
            )}
          </div>
          <div>
            <p className="font-bold text-ink">{activeChat.name}</p>
            <p className="text-xs text-slate-500">
              {activeChat.online ? "En línea" : "Desconectado"}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-100">📞</button>
            <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-slate-100">🎥</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <div className="space-y-4">
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%] ${
                    msg.sender === "user"
                      ? "bg-teal-700 text-white"
                      : "bg-[#F1F5F9] text-ink"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-4 md:px-5">
          <div className="flex items-center gap-2 md:gap-3">
            <button className="shrink-0 text-slate-400 hover:text-slate-500"><Paperclip size={18} /></button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un mensaje..."
              className="min-w-0 flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <button
              onClick={handleSend}
              className="shrink-0 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-5"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
