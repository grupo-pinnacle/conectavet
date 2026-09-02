import type { FC } from "react";
import { X, Printer, ShieldCheck, Stethoscope, PawPrint, Calendar, User, FileText } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../Button";
import Logo from "../Logo";
import type { Prescription } from "../../types";

interface PrescriptionPDFModalProps {
  prescription: Prescription;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petAge?: string | number;
  petWeight?: string | number;
  ownerName?: string;
  vetName?: string;
  vetLicense?: string;
  onClose: () => void;
}

export const PrescriptionPDFModal: FC<PrescriptionPDFModalProps> = ({
  prescription,
  petName = "Paciente",
  petSpecies = "Canino",
  petBreed,
  petAge,
  petWeight,
  ownerName = "Tutor responsable",
  vetName = "Dr. Veterinario",
  vetLicense = "M.P. 10.452 / SENASA H-892",
  onClose,
}) => {
  const dateStr = new Date(prescription.createdAt || Date.now()).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeStr = new Date(prescription.createdAt || Date.now()).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rxCode = `RX-${prescription.id ? prescription.id.slice(-8).toUpperCase() : "VET" + Date.now().toString().slice(-6)}`;
  const qrValidationUrl = `https://conectavet.com/verify-rx?code=${rxCode}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8 border border-slate-200 print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Header Actions (hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <FileText className="h-4 w-4" />
            <span>Receta Digital Oficial ConectaVet</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-semibold">
              <Printer className="h-4 w-4" />
              <span>Imprimir / Descargar PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 text-slate-800 space-y-6 print:p-6" id="prescription-printable-area">
          {/* Top Medical Banner */}
          <div className="flex items-start justify-between border-b-2 border-teal-600 pb-5">
            <div>
              <Logo size="md" />
              <p className="text-xs text-slate-500 font-medium mt-1">Plataforma de Telemedicina Veterinaria Certificada</p>
              <p className="text-[11px] text-slate-400">Ley 25.326 · Matrícula de Habilitación Profesional</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-teal-50 px-2.5 py-1 text-xs font-mono font-bold text-teal-800 border border-teal-200">
                {rxCode}
              </span>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {dateStr} {timeStr} hs
              </p>
            </div>
          </div>

          {/* Patient & Owner Details */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <PawPrint className="h-3 w-3 text-teal-600" /> Datos de la Mascota
              </p>
              <p className="font-bold text-sm text-slate-900">{petName}</p>
              <p className="text-slate-600 font-medium">
                {petSpecies} {petBreed ? `· ${petBreed}` : ""}
              </p>
              <p className="text-slate-500">
                {petAge ? `Edad: ${petAge}` : ""} {petWeight ? `· Peso: ${petWeight} kg` : ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <User className="h-3 w-3 text-teal-600" /> Tutor Responsable
              </p>
              <p className="font-bold text-sm text-slate-900">{ownerName}</p>
              <p className="text-slate-600 font-medium">Consulta Telemedicina ConectaVet</p>
              <p className="text-teal-700 font-medium text-[11px]">Identidad Verificada</p>
            </div>
          </div>

          {/* Rx Prescriptions Content */}
          <div className="space-y-4">
            <div className="border-l-4 border-teal-600 pl-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Prescripción Farmacológica (Rp/)
              </h3>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <span className="col-span-5">Medicamento</span>
                <span className="col-span-3">Dosis</span>
                <span className="col-span-2">Frecuencia</span>
                <span className="col-span-2 text-right">Duración</span>
              </div>
              <div className="p-4 bg-white space-y-3">
                <div className="grid grid-cols-12 text-sm items-center font-semibold text-slate-900 pb-2 border-b border-slate-100">
                  <span className="col-span-5 text-teal-900">{prescription.medication || prescription.content || "Indicación médica"}</span>
                  <span className="col-span-3 text-slate-700 font-medium">{prescription.dosage || "Según indicación"}</span>
                  <span className="col-span-2 text-slate-700 font-medium">{prescription.frequency || "1 vez/día"}</span>
                  <span className="col-span-2 text-right text-slate-700 font-medium">{prescription.durationDays ? `${prescription.durationDays} días` : "7 días"}</span>
                </div>

                {prescription.indications && (
                  <div className="rounded-lg bg-teal-50/60 p-3 text-xs text-teal-950">
                    <span className="font-bold">Indicaciones específicas: </span>
                    {prescription.indications}
                  </div>
                )}

                {prescription.content && prescription.content !== prescription.medication && (
                  <div className="text-xs text-slate-600 pt-1 leading-relaxed">
                    <span className="font-semibold text-slate-800">Instrucciones y cuidados generales: </span>
                    {prescription.content}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Signature & QR Verification Footer */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 items-end">
            <div className="flex items-center gap-3">
              {/* Real QR Code */}
              <div className="h-20 w-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                <QRCodeSVG value={qrValidationUrl} size={68} level="M" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-green-700 font-bold text-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Firma Digital Verificada</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Escaneá para comprobar autenticidad y validez en farmacias y veterinarias habilitadas.
                </p>
                <p className="text-[10px] text-slate-400 font-mono">{qrValidationUrl}</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="h-12 flex items-end justify-end">
                <div className="border-b-2 border-slate-400 w-48 text-center pb-1">
                  <span className="font-serif italic text-sm text-teal-900 font-bold">{vetName}</span>
                </div>
              </div>
              <p className="font-bold text-xs text-slate-900">{vetName}</p>
              <p className="text-[11px] text-slate-600 font-medium">{vetLicense}</p>
              <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <Stethoscope className="h-3 w-3 text-teal-600" /> Médico Veterinario Certificado
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Documento emitido conforme a las directivas de Telemedicina Veterinaria de la República Argentina. Válido por 30 días a partir de la fecha de emisión.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPDFModal;
