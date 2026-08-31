import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center py-20 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft text-brand text-sm rounded-full mb-6">
          <span className="w-2 h-2 bg-brand rounded-full" />
          Telemedicina veterinaria
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
          Cuidá a tu mascota,
          <br />
          <span className="text-brand">desde cualquier lugar</span>
        </h1>
        <p className="text-lg text-ink-soft max-w-2xl mx-auto mb-8">
          Conectá con veterinarios profesionales por videollamada. Atención inmediata para tu compañero, sin estrés ni traslados.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/register">
            <Button size="lg">Empezar gratis</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Iniciar sesión</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🩺</div>
            <h3 className="text-lg font-semibold text-ink mb-2">Videollamadas</h3>
            <p className="text-sm text-ink-soft">
              Hablá con veterinarios matriculados en tiempo real, sin salir de tu casa.
            </p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📋</div>
            <h3 className="text-lg font-semibold text-ink mb-2">Historial clínico</h3>
            <p className="text-sm text-ink-soft">
              Recetas, diagnósticos y seguimiento médico en un solo lugar.
            </p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
            <h3 className="text-lg font-semibold text-ink mb-2">Atención rápida</h3>
            <p className="text-sm text-ink-soft">
              Cola de espera en vivo. Conectá con un profesional en minutos.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card padding="lg" className="bg-brand text-white">
          <h2 className="text-3xl font-bold mb-3">¿Listo para empezar?</h2>
          <p className="text-white/90 mb-6 max-w-lg mx-auto">
            Sumate a ConectaVet y accedé a atención veterinaria profesional cuando la necesites.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">Crear cuenta gratis</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}