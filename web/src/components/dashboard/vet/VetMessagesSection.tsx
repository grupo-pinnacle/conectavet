import { useState } from "react";
import { Paperclip } from "lucide-react";
import Button from "../../Button";

const chats = [
  { id: 1, name: "Juan Pérez", pet: "Firulais", avatar: "J", online: true, lastMsg: "Gracias doctor, ya está mucho mejor", unread: 2, messages: [
    { sender: "owner", text: "Doctor, Firulais sigue con comezón" },
    { sender: "vet", text: "¿Le está dando el medicamento que le receté?" },
    { sender: "owner", text: "Sí, dos veces al día como indicó" },
    { sender: "vet", text: "Perfecto, démelo por 3 días más y avíseme" },
    { sender: "owner", text: "Gracias doctor, ya está mucho mejor" },
  ]},
  { id: 2, name: "María García", pet: "Mishi", avatar: "M", online: false, lastMsg: "La crema está funcionando bien", unread: 0, messages: [
    { sender: "owner", text: "La crema está funcionando bien, la dermatitis está desapareciendo" },
    { sender: "vet", text: "Me alegra mucho. Termine el tratamiento completo" },
  ]},
  { id: 3, name: "Carlos López", pet: "Luna", avatar: "C", online: true, lastMsg: "¿Cuándo podemos agendar la vacuna?", unread: 1, messages: [
    { sender: "owner", text: "¿Cuándo podemos agendar la vacuna?" },
  ]},
  { id: 4, name: "Pedro Díaz", pet: "Rocky", avatar: "P", online: false, lastMsg: "Rocky ya camina mejor", unread: 0, messages: [
    { sender: "owner", text: "Rocky ya camina mejor después de la cirugía" },
    { sender: "vet", text: "Excelente, siga con el reposo 2 semanas más" },
  ]},
];

export default function VetMessagesSection() {
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [showList, setShowList] = useState(true);
  const [input, setInput] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      <div className={`w-full shrink-0 border-r border-border md:w-72 ${showList ? "block" : "hidden md:block"}`}>
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-lg font-bold text-ink">Mensajes</h2>
          <p className="text-xs text-slate-500">Comunicación con dueños</p>
        </div>
        <div className="overflow-y-auto" style={{ height: "calc(100% - 70px)" }}>
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
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ink">{chat.name}</p>
                  {chat.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{chat.pet}</p>
                <p className="truncate text-sm text-slate-400">{chat.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

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
            <p className="text-xs text-slate-500">{activeChat.pet} · {activeChat.online ? "En línea" : "Desconectado"}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowCloseModal(true)} className="ml-auto w-auto">
            Cerrar consulta
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <div className="space-y-4">
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "vet" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%] ${
                    msg.sender === "vet"
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
            <button onClick={handleSend} className="shrink-0 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-5">
              Enviar
            </button>
          </div>
        </div>
      </div>
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-ink">Cerrar consulta</h3>
            <p className="mb-4 text-sm text-slate-500">Agregá notas de cierre (opcional):</p>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Escribí las notas finales de la consulta..."
              rows={4}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => { setShowCloseModal(false); setCloseNotes(""); }}>
                Cancelar
              </Button>
              <Button variant="danger" size="md" fullWidth={false} onClick={() => { setShowCloseModal(false); setCloseNotes(""); }}>
                Confirmar cierre
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
