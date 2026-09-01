"use client";

import { useSession } from "next-auth/react";
import { Sidebar, type SidebarItem } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import Link from "next/link";
import { ReactNode } from "react";

const clientItems: SidebarItem[] = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", exactMatch: true },
  { href: "/dashboard/pets", label: "Mis mascotas", icon: "🐾" },
  { href: "/dashboard/consultations", label: "Consultas", icon: "🩺" },
  { href: "/dashboard/vets", label: "Veterinarios", icon: "👨‍⚕️" },
  { href: "/dashboard/history", label: "Historial", icon: "📋" },
  { href: "/dashboard/messages", label: "Mensajes", icon: "💬" },
  { href: "/dashboard/profile", label: "Perfil", icon: "👤" },
];

const vetItems: SidebarItem[] = [
  { href: "/vet", label: "Dashboard", icon: "🏠", exactMatch: true },
  { href: "/vet/consultas", label: "Consultas / Agenda", icon: "📅" },
  { href: "/vet/pacientes", label: "Pacientes", icon: "🐾" },
  { href: "/vet/historial", label: "Historial clínico", icon: "📋" },
  { href: "/vet/recetas", label: "Recetas", icon: "💊" },
  { href: "/vet/mensajes", label: "Mensajes", icon: "💬" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isVetRoute = pathname.startsWith("/vet");
  const isVet = session?.user?.role === "VET";
  const isApproved = session?.user?.vetStatus === "APPROVED";

  const items = isVetRoute ? vetItems : clientItems;

  const sidebarFooter = (
    <div className="space-y-2">
      {isVetRoute && isVet && !isApproved && (
        <div className="p-3 bg-amber-50 rounded-md text-xs text-amber-800">
          ⏳ Cuenta pendiente de aprobación
        </div>
      )}
      {!isVetRoute && (
        <div className="p-3 bg-brand-soft rounded-md text-xs">
          <p className="font-semibold text-brand mb-1">¿Necesitas ayuda?</p>
          <p className="text-ink-soft mb-2">Contactanos cuando quieras.</p>
          <Link href="/dashboard/consultations/new">
            <Button size="sm" className="w-full">+ Nueva consulta</Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar title="VetConnect" subtitle={isVetRoute ? "Panel veterinario" : "Tu mascota, nuestra prioridad"} items={items} footer={sidebarFooter} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}