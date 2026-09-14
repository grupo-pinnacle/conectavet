import { Link } from "react-router-dom";
import { Heart, Stethoscope, Pill, AmbulanceIcon, ChevronRight, Shield, MessageCircle, Video, Star } from "lucide-react";
import Logo from "../components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-border bg-white/95 backdrop-blur-sm px-6 md:px-12">
      <Logo />
      <div className="hidden items-center gap-8 md:flex">
        {["Inicio", "Servicios", "Cómo funciona", "Contacto"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-teal-700"
          >
            {item}
          </a>
        ))}
      </div>
      <Link
        to="/login"
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-teal-700 via-teal-600 to-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/25 ring-1 ring-inset ring-white/20 transition-all duration-fast hover:from-teal-800 hover:via-teal-700 hover:to-green-700 hover:shadow-lg hover:shadow-teal-600/35 hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-ui group-hover:translate-x-[150%] motion-reduce:hidden" />
        <span className="relative">Iniciar sesión</span>
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-white pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-green-100/60 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div className="z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-dark">
            <span className="h-2 w-2 rounded-full bg-success" />
            TELECONSULTAS VETERINARIAS
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-ink md:text-5xl tracking-tight">
            Cuidado veterinario
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-teal-700 to-green-600 bg-clip-text text-transparent">siempre al alcance</span>
          </h1>
          <p className="mb-10 max-w-lg text-body leading-relaxed text-slate-600">
            Conectá con veterinarios matriculados por chat y videollamada en tiempo real. Historial clínico digital, recetas médicas y seguimiento profesional en una sola plataforma.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-teal-700 via-teal-600 to-green-600 px-8 py-4 font-bold text-white shadow-lg shadow-teal-600/30 ring-1 ring-inset ring-white/20 transition-all duration-fast hover:from-teal-800 hover:via-teal-700 hover:to-green-700 hover:shadow-xl hover:shadow-teal-600/40 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-ui group-hover:translate-x-[150%] motion-reduce:hidden" />
              <span className="relative whitespace-nowrap">Comenzar ahora</span>
              <ChevronRight className="relative h-4 w-4 flex-shrink-0" />
            </Link>
            <a
              href="#servicios"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-border bg-white px-8 py-4 font-bold text-ink shadow-sm transition-all duration-fast hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 hover:shadow-md active:scale-[0.97]"
            >
              Ver servicios
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-green-100/40 blur-3xl" />
          <div className="relative z-10 overflow-hidden rounded-3xl border border-white bg-white/70 shadow-overlay backdrop-blur-sm">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-teal-50 via-white to-green-50 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-green-500 shadow-lg shadow-teal-600/25">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <p className="text-lg font-bold text-ink">Cuidado veterinario</p>
                <p className="text-sm text-slate-500">desde la comodidad de tu hogar</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-teal-700 shadow-md ring-1 ring-inset ring-border">
              24/7 disponible
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-teal-700">
          Nuestros números
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard number="2,500+" label="Veterinarios" />
          <StatCard number="15,000+" label="Usuarios activos" />
          <StatCard number="8,000+" label="Mascotas atendidas" />
          <StatCard number="24/7" label="Disponibilidad" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-white p-6 text-center shadow-subtle transition-all hover:shadow-raised hover:scale-[1.02]">
      <p className="mb-1 text-3xl font-bold text-teal-700">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

const services = [
  { title: "Consultas generales", desc: "Revisiones de rutina, consejos de nutrición y cuidados preventivos desde casa.", icon: Stethoscope },
  { title: "Chat con veterinario", desc: "Comunicate en tiempo real con tu veterinario asignado.", icon: MessageCircle },
  { title: "Recetas y recetas", desc: "Renová recetas existentes mediante consulta virtual.", icon: Pill },
  { title: "Triaje de urgencia", desc: "Evaluación inmediata para determinar si tu mascota necesita atención presencial.", icon: AmbulanceIcon },
];

function Services() {
  return (
    <section id="servicios" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-ink tracking-tight">
            Todo lo que tu mascota necesita
          </h2>
          <p className="mx-auto max-w-2xl text-body text-slate-500">
            Servicios veterinarios completos desde la comodidad de tu hogar.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-white p-8 shadow-subtle transition-all duration-300 hover:border-teal-600 hover:shadow-overlay hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 left-0 h-full w-1 scale-y-0 bg-teal-600 transition-transform group-hover:scale-y-100" />
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="mb-3 text-lg font-bold text-ink">{s.title}</h4>
                <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Star, title: "Creá tu cuenta", desc: "Registrate en segundos y agregá tus mascotas." },
    { icon: MessageCircle, title: "Chateá con el veterinario", desc: "Comunicate en tiempo real con el veterinario asignado." },
    { icon: Video, title: "Videollamada con veterinario", desc: "Si necesitás atención en vivo, te conectamos con un profesional." },
    { icon: Shield, title: "Seguimiento completo", desc: "Historial clínico, diagnósticos y recetas siempre disponibles." },
  ];

  return (
    <section id="como-funciona" className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-ink tracking-tight">Cómo funciona</h2>
          <p className="mx-auto max-w-2xl text-body text-slate-500">En 4 pasos simples.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex flex-col items-center text-center animate-slideUp" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-bold mb-3">
                  {i + 1}
                </div>
                <h4 className="text-lg font-bold text-ink mb-2">{s.title}</h4>
                <p className="text-sm text-slate-500 max-w-[240px]">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 py-20 md:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 px-8 py-16 text-center text-white md:px-16">
        <div className="absolute -top-48 -right-48 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <h2 className="relative z-10 mb-6 text-3xl font-bold tracking-tight">
          ¿Listo para cuidar a tu mascota?
        </h2>
        <p className="relative z-10 mx-auto mb-10 max-w-xl text-body text-teal-100">
          Unite a miles de dueños que confían en VetConnect para atención veterinaria profesional 24/7.
        </p>
        <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-white px-10 py-4 font-bold text-teal-700 shadow-xl transition-all duration-fast hover:scale-105 hover:shadow-2xl active:scale-[0.98]"
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-teal-200/60 to-transparent transition-transform duration-700 ease-ui group-hover:translate-x-[150%] motion-reduce:hidden" />
            <span className="relative whitespace-nowrap">Comenzar ahora</span>
            <ChevronRight className="relative h-4 w-4 flex-shrink-0" />
          </Link>
          <a
            href="#servicios"
            className="group relative inline-flex items-center overflow-hidden rounded-lg border border-white/30 px-10 py-4 font-bold text-white transition-all duration-fast hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/50 active:scale-[0.97]"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between border-t border-border px-6 py-12 md:flex-row md:px-12">
      <div className="mb-8 flex flex-col items-center gap-4 md:mb-0 md:items-start">
        <Logo size="sm" />
        <p className="max-w-xs text-center text-sm text-slate-500 md:text-left">
          © 2026 VetConnect. Cuidado veterinario profesional, reinventado.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
        {["Privacidad", "Términos", "Contacto"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-teal-600"
          >
            {item}
          </a>
        ))}
      </div>
    </footer>
  );
}
