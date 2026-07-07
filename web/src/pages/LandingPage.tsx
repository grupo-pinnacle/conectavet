import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <CTASection />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-border-light bg-white px-6 transition-all duration-300 md:px-12">
      <Logo />
      <div className="hidden items-center gap-8 md:flex">
        <a href="#inicio" className="border-b-2 border-[#2563EB] pb-1 text-sm font-bold text-[#2563EB]">
          Inicio
        </a>
        <a href="#servicios" className="text-sm font-bold text-gray-400 transition-colors hover:text-[#2563EB]">
          Servicios
        </a>
        <a href="#como-funciona" className="text-sm font-bold text-gray-400 transition-colors hover:text-[#2563EB]">
          Cómo funciona
        </a>
        <a href="#sobre-nosotros" className="text-sm font-bold text-gray-400 transition-colors hover:text-[#2563EB]">
          Sobre nosotros
        </a>
        <a href="#contacto" className="text-sm font-bold text-gray-400 transition-colors hover:text-[#2563EB]">
          Contacto
        </a>
      </div>
      <Link
        to="/login"
        className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Inicio Sesión
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-white pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div className="z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#22C55E]">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            ATENCIÓN VETERINARIA 24/7
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-[#0F172A] md:text-5xl">
            Conectar con el mejor
            <br />
            cuidado
            <br />
            para tu mascota
          </h1>
          <p className="mb-10 max-w-lg text-base leading-relaxed text-[#475569]">
            Consultas veterinarias en línea, rápidas, seguras y desde donde
            estés. Tu mascota merece lo mejor.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button className="rounded-lg bg-[#2563EB] px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
              Conocer más
            </button>
            <button className="rounded-lg border border-border-light bg-white px-8 py-4 font-bold text-[#1E293B] transition-all hover:bg-gray-50">
              Conocer más
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-blue-100 opacity-50 blur-3xl" />
          <div className="relative z-10 overflow-hidden rounded-2xl border border-border-light bg-white shadow-lg">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <svg className="h-10 w-10 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-[#0F172A]">Cuidado veterinario</p>
                <p className="text-sm text-[#475569]">desde la comodidad de tu hogar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-[#F8FAFC] py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <p className="mb-8 text-center text-sm font-bold uppercase tracking-wider text-[#2563EB]">
          NUESTROS SERVICIOS
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard number="2,500+" label="Médicos registrados" />
          <StatCard number="15,000+" label="Usuarios activos" />
          <StatCard number="8,000+" label="Mascotas atendidas" />
          <StatCard number="24/7" label="Horas disponibles" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border-light/50 bg-white p-6 text-center shadow-sm transition-transform hover:scale-105">
      <p className="mb-1 text-3xl font-bold text-[#2563EB]">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
        {label}
      </p>
    </div>
  );
}

const services = [
  {
    title: "Consultas generales",
    desc: "Revisiones de rutina, consejos de nutrición y cuidados preventivos desde casa.",
    icon: "🩺",
  },
  {
    title: "Asesoramiento conductual",
    desc: "Guía experta para ansiedad, problemas de entrenamiento y comportamiento.",
    icon: "🧠",
  },
  {
    title: "Renovación de recetas",
    desc: "Revisa y renueva recetas existentes mediante consulta virtual.",
    icon: "💊",
  },
  {
    title: "Triaje de urgencia",
    desc: "Evaluación inmediata para determinar si tu mascota necesita atención presencial.",
    icon: "🚑",
  },
];

function Services() {
  return (
    <section id="servicios" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#0F172A]">
            Todo lo que tu mascota necesita
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#475569]">
            Servicios veterinarios completos desde la comodidad de tu hogar.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-xl border border-border-light bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-500/5"
            >
              <div className="absolute top-0 left-0 h-full w-1 scale-y-0 bg-[#16A34A] transition-transform group-hover:scale-y-100" />
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[#F8FAFC] text-2xl transition-colors">
                {s.icon}
              </div>
              <h4 className="mb-3 text-lg font-bold text-[#0F172A]">{s.title}</h4>
              <p className="text-sm leading-relaxed text-[#475569]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 py-20 md:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#2563EB] px-8 py-16 text-center text-white md:px-16">
        <div className="absolute -top-48 -right-48 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />
        <h2 className="relative z-10 mb-6 text-3xl font-bold">
          ¿Listo para cuidar a tu mascota?
        </h2>
        <p className="relative z-10 mx-auto mb-10 max-w-xl text-lg text-blue-100">
          Unite a miles de dueños de mascotas que confían en VetConnect para
          atención veterinaria profesional 24/7.
        </p>
        <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-lg bg-white px-10 py-4 font-bold text-[#2563EB] shadow-xl transition-all hover:scale-105"
          >
            Comenzar ahora
          </Link>
          <button className="rounded-lg border border-white/30 px-10 py-4 font-bold text-white transition-all hover:bg-white/10">
            Ver todos los servicios
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between border-t border-border-light px-6 py-12 md:flex-row md:px-12">
      <div className="mb-8 flex flex-col items-center gap-4 md:mb-0 md:items-start">
        <Logo size="sm" />
        <p className="max-w-xs text-center text-sm text-[#475569] md:text-left">
          © 2025 VetConnect. Cuidado veterinario profesional, reinventado.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
        <a href="#" className="text-xs font-semibold uppercase tracking-wider text-[#475569] transition-colors hover:text-[#16A34A]">
          Privacidad
        </a>
        <a href="#" className="text-xs font-semibold uppercase tracking-wider text-[#475569] transition-colors hover:text-[#16A34A]">
          Términos
        </a>
        <a href="#" className="text-xs font-semibold uppercase tracking-wider text-[#475569] transition-colors hover:text-[#16A34A]">
          Contacto
        </a>
      </div>
    </footer>
  );
}
