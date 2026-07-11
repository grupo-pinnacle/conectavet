import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import HomeSection from "../components/dashboard/HomeSection";
import PetsSection from "../components/dashboard/PetsSection";
import ConsultationsSection from "../components/dashboard/ConsultationsSection";
import HistorySection from "../components/dashboard/HistorySection";
import PrescriptionsSection from "../components/dashboard/PrescriptionsSection";
import MessagesSection from "../components/dashboard/MessagesSection";
import ProfileSection from "../components/dashboard/ProfileSection";
import NotificationsSection from "../components/dashboard/NotificationsSection";
import WaitingRoom from "../components/dashboard/WaitingRoom";

const navItems = [
  { label: "Inicio", icon: "🏠", key: "home" },
  { label: "Mascotas", icon: "🐾", key: "pets" },
  { label: "Consultas", icon: "📅", key: "consultations" },
  { label: "Historial", icon: "📋", key: "history" },
  { label: "Recetas", icon: "💊", key: "prescriptions" },
  { label: "Mensajes", icon: "💬", key: "messages" },
  { label: "Notificaciones", icon: "🔔", key: "notifications" },
  { label: "Perfil", icon: "👤", key: "profile" },
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
      case "home":
        return <HomeSection onNavigate={setActiveTab} />;
      case "pets":
        return <PetsSection />;
      case "consultations":
        return <ConsultationsSection />;
      case "history":
        return <HistorySection />;
      case "prescriptions":
        return <PrescriptionsSection />;
      case "messages":
        return <MessagesSection />;
      case "notifications":
        return <NotificationsSection />;
      case "profile":
        return <ProfileSection />;
      case "waiting":
        return <WaitingRoom onBack={() => setActiveTab("home")} />;
      default:
        return <HomeSection onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-[#CBD5E1] bg-white md:flex">
        <div className="border-b border-[#CBD5E1] px-6 py-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
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
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-[#CBD5E1] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-[#0F172A]">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-[#475569]">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-[#CBD5E1] bg-white px-5 py-4 md:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab("notifications")} className="relative text-xl">
            🔔
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </button>
          <button onClick={handleLogout} className="text-sm text-red-500">
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          {renderSection()}
        </div>
      </main>

      {/* Mobile bottom nav */}
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
