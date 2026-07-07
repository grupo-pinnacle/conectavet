const notifications = [
  { icon: "📅", title: "Recordatorio de consulta", desc: "Tienes una consulta con el Dr. Martín Lopez mañana a las 15:30 hs", time: "Hace 5 min", read: false },
  { icon: "💊", title: "Recordatorio de medicación", desc: "Administrar Amoxicilina a Firulais a las 20:00 hs", time: "Hace 1 hora", read: false },
  { icon: "⭐", title: "Nueva reseña", desc: "Dra. Sofía Ramirez ha recibido una nueva reseña", time: "Hace 3 horas", read: false },
  { icon: "🐾", title: "Cita confirmada", desc: "Tu cita con Dra. Ana Torres para Mishi ha sido confirmada", time: "Ayer", read: true },
  { icon: "🔔", title: "Promoción especial", desc: "20% de descuento en consultas de dermatología", time: "Ayer", read: true },
  { icon: "💬", title: "Nuevo mensaje", desc: "Dr. Iván te ha enviado un mensaje", time: "Hace 2 días", read: true },
];

export default function NotificationsSection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Notificaciones</h1>
          <p className="text-[#475569]">Mantente al día con tus mascotas</p>
        </div>
        <button className="text-sm font-semibold text-[#2563EB] hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm ${
              n.read ? "border-[#CBD5E1] bg-white" : "border-[#2563EB]/30 bg-blue-50"
            }`}
          >
            <span className="mt-1 text-2xl">{n.icon}</span>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className={`text-sm font-bold text-[#0F172A] ${!n.read ? "text-[#2563EB]" : ""}`}>
                  {n.title}
                </p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-[#2563EB]" />}
              </div>
              <p className="text-sm text-[#475569]">{n.desc}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
