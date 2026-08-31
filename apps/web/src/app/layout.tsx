import type { Metadata } from "next";
import "@conectavet/web/src/styles/tokens.css";
import "./globals.css";
import { fontSans } from "~/font";
import { TRPCProvider } from "~/trpc/provider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "ConectaVet",
  description: "Telemedicina veterinaria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={fontSans.variable}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <SessionProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
