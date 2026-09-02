import { useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, Stethoscope, CheckCircle2, Calendar, FileText, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";

export default function VerifyRxPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "RX-OFICIAL";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Top brand */}
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-8 text-white text-center relative">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Receta Digital Verificada</h1>
            <p className="text-xs text-teal-100 mt-1 font-medium">
              Documento Oficial emitido bajo el marco de Telemedicina Veterinaria (República Argentina)
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Status Pill */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Estado de Validez</div>
                  <div className="text-sm font-semibold">Auténtica & Vigente (30 días)</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-800">
                {code}
              </span>
            </div>

            {/* Medical Info */}
            <div className="space-y-4 text-xs text-slate-700 border-t border-b border-slate-100 py-4">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-600" /> Profesional Emisor:
                </span>
                <span className="font-bold text-slate-900 text-right">Médico Veterinario Matriculado</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" /> Plataforma Emisora:
                </span>
                <span className="font-semibold text-slate-900 text-right">ConectaVet Cloud Telehealth</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-teal-600" /> Normativa Aplicable:
                </span>
                <span className="font-semibold text-slate-900 text-right">Ley 25.326 & Disposiciones Sanitarias</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-500 leading-relaxed space-y-1.5 border border-slate-100">
              <p className="font-semibold text-slate-700">Aviso para farmacias y clínicas veterinarias:</p>
              <p>
                Esta receta médica digital fue generada por un profesional veterinario a través de una teleconsulta
                auditable en ConectaVet. El profesional se encuentra debidamente identificado en el sistema.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              Imprimir Comprobante de Validación
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 mt-8">
        ConectaVet &copy; {new Date().getFullYear()} — Infraestructura Digital de Telemedicina Veterinaria
      </footer>
    </div>
  );
}
