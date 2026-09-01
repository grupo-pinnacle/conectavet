"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui";
import { Button } from "@/components/ui";
import { useState } from "react";

export interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;

  return (
    <header className="bg-white border-b border-border px-6 h-16 flex items-center justify-between gap-4 sticky top-0 z-20">
      {title ? (
        <h2 className="text-lg font-semibold text-ink truncate">{title}</h2>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-3">
        <button
          aria-label="Buscar"
          className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-ink-soft"
        >
          🔍
        </button>
        <button
          aria-label="Calendario"
          className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-ink-soft"
        >
          📅
        </button>
        <button
          aria-label="Notificaciones"
          className="relative w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-ink-soft"
        >
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-surface"
            aria-label="Menú de usuario"
            aria-expanded={menuOpen}
          >
            <Avatar name={user?.name} alt={user?.email || "Usuario"} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-ink leading-tight">{user?.name || user?.email?.split("@")[0] || "Usuario"}</p>
              <p className="text-[10px] text-ink-soft capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <span className="text-ink-soft text-xs">▾</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-[var(--radius-md)] shadow-elevated py-1 z-30">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-ink truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}