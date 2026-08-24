import { useState } from "react";
import { PawPrint, ClipboardList } from "lucide-react";
import PetsSection from "./PetsSection";
import HistorySection from "./HistorySection";

type View = "pets" | "history";

export default function PetsHistorySection({ onAgendarCita }: { onAgendarCita?: (petId: string) => void }) {
  const [view, setView] = useState<View>("pets");

  return (
    <div>
      {/* Toggle unificado: Mascotas + Historial van de la mano */}
      <div className="mb-6 inline-flex rounded-xl border border-border bg-white p-1 shadow-sm">
        <button
          onClick={() => setView("pets")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            view === "pets" ? "bg-teal-700 text-white shadow-subtle" : "text-slate-500 hover:text-ink"
          }`}
        >
          <PawPrint className="h-4 w-4" /> Mascotas
        </button>
        <button
          onClick={() => setView("history")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            view === "history" ? "bg-teal-700 text-white shadow-subtle" : "text-slate-500 hover:text-ink"
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Historial clínico
        </button>
      </div>

      {view === "pets" ? <PetsSection onAgendarCita={onAgendarCita} /> : <HistorySection />}
    </div>
  );
}
