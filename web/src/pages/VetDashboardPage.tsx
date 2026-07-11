import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import VetHomeSection from "../components/dashboard/vet/VetHomeSection";
import AgendaSection from "../components/dashboard/vet/AgendaSection";
import PatientsSection from "../components/dashboard/vet/PatientsSection";
import VetHistorySection from "../components/dashboard/vet/VetHistorySection";
import VetPrescriptionsSection from "../components/dashboard/vet/VetPrescriptionsSection";
import VetMessagesSection from "../components/dashboard/vet/VetMessagesSection";
import ReportsSection from "../components/dashboard/vet/ReportsSection";
import FinancesSection from "../components/dashboard/vet/FinancesSection";
import SettingsSection from "../components/dashboard/vet/SettingsSection";

const navItems = [
  { label: "Dashboard", icon: "📊", key: "home" },
  { label: "Agenda", icon: "📅", key: "agenda" },
  { label: "Pacientes", icon: "🐾", key: "patients" },
  { label: "Historial", icon: "📋", key: "history" },
  { label: "Recetas", icon: "💊", key: "prescriptions" },
  { label: "Mensajes", icon: "💬", key: "messages" },
  { label: "Reportes", icon: "📈", key: "reports" },
  { label: "Finanzas", icon: "💰", key: "finances" },
  { label: "Configuración", icon: "⚙️", key: "settings" },
];

export default function VetDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "home": return <VetHomeSection />;
      case "agenda": return <AgendaSection />;
      case "patients": return <PatientsSection />;
      case "history": return <VetHistorySection />;
      case "prescriptions": return <VetPrescriptionsSection />;
      case "messages": return <VetMessagesSection />;
      case "reports": return <ReportsSection />;
      case "finances": return <FinancesSection />;
      case "settings": return <SettingsSection />;
      default: return <VetHomeSection />;
    }
  };

  const getUnreadBadge = (key: string) => {
    if (key === "messages") return "3";
    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <aside className="hidden w-64 flex-col border-r border-[#CBD5E1] bg-white md:flex">
        <div className="border-b border-[#CBD5E1] px-6 py-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const badge = getUnreadBadge(item.key);
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === item.key
                    ? "bg-[#2563EB] text-white"
                    : "text-[#475569] hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#CBD5E1] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
              {user?.name?.charAt(0) || "D"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-[#0F172A]">Dr. {user?.name || "Martín López"}</p>
              <p className="text-xs text-[#475569]">{user?.email || "martin@vetconnect.com"}</p>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Salir</button>
          </div>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-[#CBD5E1] bg-white px-5 py-4 md:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab("messages")} className="relative text-xl">
            💬
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
          </button>
          <button onClick={handleLogout} className="text-sm text-red-500">Salir</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          {renderSection()}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#CBD5E1] bg-white md:hidden">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                activeTab === item.key ? "text-[#2563EB]" : "text-[#94A3B8]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
