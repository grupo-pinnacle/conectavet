"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Principal">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-brand" aria-label="ConectaVet Inicio">
              ConectaVet
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  const user = session.user;
  const isVet = user.role === "VET";
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Principal">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand" aria-label="ConectaVet Inicio">
            ConectaVet
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">
              {isVet ? "Mis consultas" : "Mis mascotas"}
            </Link>
            {isVet && (
              <Link href="/dashboard/queue" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">
                Cola de espera
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-sm font-medium text-ink-soft hover:text-brand transition-colors">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-ink-soft">
              {user.name || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              Salir
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}