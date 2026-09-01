import type { Metadata } from "next";
import "@/styles/tokens.css";
import "./globals.css";
import { fontSans } from "~/font";
import { Providers } from "~/trpc/provider";

export const metadata: Metadata = {
  title: "VetConnect — Telemedicina veterinaria",
  description: "Conectá con veterinarios matriculados desde cualquier lugar. Atención inmediata para tu mascota.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={fontSans.variable}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}