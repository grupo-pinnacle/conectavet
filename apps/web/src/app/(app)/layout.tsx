import { AppShell } from "@/components/layout/AppShell";

// Todas las rutas autenticadas son dinámicas (dependen de la sesión)
export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}