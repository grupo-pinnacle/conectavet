"use client";

import { ReactNode } from "react";
import { Header } from "./Header";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-ink-soft">
        <p>ConectaVet — Telemedicina veterinaria</p>
      </footer>
    </div>
  );
}