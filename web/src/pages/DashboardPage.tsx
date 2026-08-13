import { useState, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Home, PawPrint, Calendar, ClipboardList, MessageCircle, Search, User, LogOut } from "lucide-react";
import Logo from "../components/Logo";
import HomeSection from "../components/dashboard/HomeSection";
import PetsHistorySection from "../components/dashboard/PetsHistorySection";
import ConsultationsSection from "../components/dashboard/ConsultationsSection";
import MessagesSection from "../components/dashboard/MessagesSection";
import DirectorySection from "../components/dashboard/DirectorySection";
import ProfileSection from "../components/dashboard/ProfileSection";
import { getMyConsultations } from "../services/endpoints";
import { connectSocket } from "../services/socket";
import { notifyDataChanged } from "../services/realtime";

const navItems = [
  { label: "Inicio", icon: Home, key: "home" },
  { label: "Mascotas", icon: PawPrint, key: "pets" },
  { label: "Consultas", icon: Calendar, key: "consultations" },
  { label: "Mensajes", icon: MessageCircle, key: "messages" },
  { label: "Buscar vet", icon: Search, key: "directory" },
  { label: "Perfil", icon: User, key: "profile" },
];

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [pendingPetId, setPendingPetId] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const cons = await getMyConsultations();
      setPendingCount(cons.filter((c) => c.status === "PENDING" || c.status === "WAITING").length);
      setActiveCount(cons.filter((c) => c.status === "ACTIVE").length);
      // Avisa a las secciones (ej. "Tus consultas") que refresquen su lista.
      notifyDataChanged();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de contadores al montar
    refreshCounts();
    let cancelled = false;
    let sock: Socket | null = null;
    connectSocket()
      .then((s) => {
        if (cancelled) return;
        sock = s;
        s.on("consultation:new", refreshCounts);
        s.on("consultation:updated", refreshCounts);
        s.on("notification:new", refreshCounts);
      })
      .catch(() => {
        // Socket opcional: el proxy /socket.io lo habilita; si falla, el estado local sigue valiendo.
      });
    return () => {
      cancelled = true;
      sock?.off("consultation:new", refreshCounts);
      sock?.off("consultation:updated", refreshCounts);
      sock?.off("notification:new", refreshCounts);
    };
  }, [refreshCounts]);

  const handleAgendarCita = (petId: string) => {
    setPendingPetId(petId);
    setActiveTab("consultations");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "home": return <HomeSection onNavigate={setActiveTab} />;
      case "pets": return <PetsHistorySection onAgendarCita={handleAgendarCita} />;
      case "consultations": return <ConsultationsSection initialPetId={pendingPetId} />;
      case "messages": return <MessagesSection />;
      case "directory": return <DirectorySection />;
      case "profile": return <ProfileSection />;
      default: return <HomeSection onNavigate={setActiveTab} />;
    }
  };

  const getBadge = (key: string) => {
    if (key === "messages" && (pendingCount + activeCount) > 0) return pendingCount + activeCount;
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans md:flex-row">
      <aside className="hidden w-64 flex-col border-r border-border bg-white md:flex">
        <div className="border-b border-border px-6 py-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const badge = getBadge(item.key);
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
                <span className="flex-1 text-left">{item.label}</span>
                {badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
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
          <button onClick={() => setActiveTab("messages")} className="relative">
            <MessageCircle className="w-5 h-5 text-slate-500" />
            {getBadge("messages") && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {getBadge("messages")}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm font-semibold text-danger"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          {renderSection()}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around overflow-x-auto py-2">
          {navItems.map((item) => {
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
                <span className="text-[10px] font-semibold whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
