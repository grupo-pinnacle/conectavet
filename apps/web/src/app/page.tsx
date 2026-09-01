import Link from "next/link";
import { Button, Card, StatCard } from "@/components/ui";

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-soft to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-brand text-xs font-semibold rounded-full border border-brand-soft mb-6">
                <span className="w-2 h-2 bg-brand rounded-full" />
                ATENCIÓN VETERINARIA 24/7
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
                Conectar con el mejor cuidado para tu{" "}
                <span className="text-brand">mascota</span>
              </h1>
              <p className="text-lg text-ink-soft mb-8 max-w-xl">
                Videoconsultas al instante con veterinarios matriculados, historial clínico digital y recetas al alcance de un click.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg">Empezar gratis</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">Iniciar sesión</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="text-[12rem] text-center leading-none">🐶🐱</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Veterinarios" value="150+" icon="👨‍⚕️" variant="brand" />
          <StatCard label="Usuarios activos" value="2.4K" icon="👥" variant="success" />
          <StatCard label="Mascotas atendidas" value="8.1K" icon="🐾" variant="warning" />
          <StatCard label="Horas disponibles" value="24/7" icon="⏰" />
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand mb-2">NUESTROS SERVICIOS</p>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-3">Todo lo que tu mascota necesita</h2>
          <p className="text-ink-soft max-w-2xl mx-auto">
            Atención profesional, recordatorios automáticos, recetas digitales y mucho más.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: "🩺", title: "Videoconsultas", desc: "Conectá con un veterinario en minutos desde cualquier dispositivo." },
            { icon: "📋", title: "Historial clínico", desc: "Todos los registros, vacunas y recetas en un solo lugar seguro." },
            { icon: "💊", title: "Recetas digitales", desc: "Recibí prescripciones al instante y retirala en cualquier veterinaria." },
            { icon: "⏰", title: "Recordatorios", desc: "Vacunas, desparasitaciones y controles nunca se te van a pasar." },
            { icon: "🐾", title: "Perfil de mascota", desc: "Información completa: peso, alergias, condiciones crónicas y más." },
            { icon: "🏆", title: "Vets verificados", desc: "Solo profesionales matriculados y evaluados por nuestro equipo." },
          ].map((s) => (
            <Card key={s.title} padding="lg" hover>
              <div className="w-12 h-12 bg-brand-soft text-brand rounded-md flex items-center justify-center text-2xl mb-4">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">{s.title}</h3>
              <p className="text-sm text-ink-soft">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-brand mb-2">CÓMO FUNCIONA</p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink">En 3 pasos</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "1", title: "Registrate", desc: "Creá tu cuenta y agregá a tu mascota con foto y datos básicos." },
              { step: "2", title: "Solicitá consulta", desc: "Describí el motivo y elegí cuándo querés ser atendido." },
              { step: "3", title: "Conectáte", desc: "El veterinario te atiende por videollamada y te deja la receta." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-soft max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <Card padding="lg" className="bg-brand text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Listo para empezar?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Sumate a VetConnect y accedé a atención veterinaria profesional cuando la necesites.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">Crear cuenta gratis</Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}