"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar pública */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-brand text-white flex items-center justify-center text-lg">🐾</div>
              <span className="text-lg font-bold text-ink">VetConnect</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6" aria-label="Principal">
              <Link href="/" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">Inicio</Link>
              <Link href="/" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">Servicios</Link>
              <Link href="/" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">Cómo funciona</Link>
              <Link href="/" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">Sobre nosotros</Link>
              <Link href="/" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">Contacto</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
              <Link href="/register"><Button size="sm">Crear cuenta</Button></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 text-center text-xs text-ink-soft">
        <p>© {new Date().getFullYear()} VetConnect — Telemedicina veterinaria</p>
      </footer>
    </div>
  );
}