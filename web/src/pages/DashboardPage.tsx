import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Home, PawPrint, Calendar, ClipboardList, MessageCircle, User, LogOut } from "lucide-react";
import Logo from "../components/Logo";
import HomeSection from "../components/dashboard/HomeSection";
import PetsSection from "../components/dashboard/PetsSection";
import ConsultationsSection from "../components/dashboard/ConsultationsSection";
import HistorySection from "../components/dashboard/HistorySection";
import MessagesSection from "../components/dashboard/MessagesSection";
import ProfileSection from "../components/dashboard/ProfileSection";

const navItems = [
  { label: "Inicio", icon: Home, key: "home" },
  { label: "Mascotas", icon: PawPrint, key: "pets" },
  { label: "Consultas", icon: Calendar, key: "consultations" },
  { label: "Historial", icon: ClipboardList, key: "history" },
  { label: "Mensajes", icon: MessageCircle, key: "messages" },
  { label: "Perfil", icon: User, key: "profile" },
];

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "home": return <HomeSection onNavigate={setActiveTab} />;
      case "pets": return <PetsSection />;
      case "consultations": return <ConsultationsSection />;
      case "history": return <HistorySection />;
      case "messages": return <MessagesSection />;
      case "profile": return <ProfileSection />;
      default: return <HomeSection onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface font-sans">
      <aside className="hidden w-64 flex-col border-r border-border bg-white md:flex">
        <div className="border-b border-border px-6 py-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-fast ${
                  activeTab === item.key
                    ? "bg-teal-700 text-white shadow-subtle"
                    : "text-slate-500 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-ink">{user?.name || "Usuario"}</p>
              <p className="text-xs text-slate-500">{user?.email || ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-danger transition-colors hover:text-danger-dark"
            >
              <LogOut className="w-3 h-3" /> Salir
            </button>
          </div>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-white px-5 py-4 md:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm font-semibold text-danger"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          {renderSection()}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white md:hidden safe-area-b">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  activeTab === item.key ? "text-teal-700" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
