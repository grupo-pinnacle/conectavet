import { Calendar, Pill, PawPrint, Bell, MessageCircle } from "lucide-react";

const notifications = [
  { icon: Calendar, title: "Recordatorio de consulta", desc: "Tienes una consulta con el Dr. Martin Lopez mañana a las 15:30 hs", time: "Hace 5 min", read: false },
  { icon: Pill, title: "Recordatorio de medicación", desc: "Administrar Amoxicilina a Firulais a las 20:00 hs", time: "Hace 1 hora", read: false },
  { icon: "⭐", title: "Nueva reseña", desc: "Dra. Sofía Ramirez ha recibido una nueva reseña", time: "Hace 3 horas", read: false },
  { icon: PawPrint, title: "Cita confirmada", desc: "Tu cita con Dra. Ana Torres para Mishi ha sido confirmada", time: "Ayer", read: true },
  { icon: Bell, title: "Promoción especial", desc: "20% de descuento en consultas de dermatología", time: "Ayer", read: true },
  { icon: MessageCircle, title: "Nuevo mensaje", desc: "Dr. Iván te ha enviado un mensaje", time: "Hace 2 días", read: true },
];

export default function NotificationsSection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Notificaciones</h1>
          <p className="text-slate-500">Mantente al día con tus mascotas</p>
        </div>
        <button className="text-sm font-semibold text-teal-700 hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm ${
              n.read ? "border-border bg-white" : "border-teal-700/30 bg-teal-50"
            }`}
          >
            {typeof n.icon === "string" ? <span className="mt-1 text-2xl">{n.icon}</span> : <n.icon className="mt-1 h-7 w-7 text-teal-700" />}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className={`text-sm font-bold text-ink ${!n.read ? "text-teal-700" : ""}`}>
                  {n.title}
                </p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-teal-700" />}
              </div>
              <p className="text-sm text-slate-500">{n.desc}</p>
              <p className="mt-1 text-xs text-slate-400">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
