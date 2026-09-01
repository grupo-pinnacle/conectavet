import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Stethoscope, ClipboardList, CheckCircle2, Clock,
  LogOut, Search, ChevronLeft, ChevronRight, ShieldCheck,
  ShieldX, RefreshCw, Trash2,
} from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import {
  adminGetStats, adminListUsers, adminUpdateVetStatus, adminBatchDeleteUsers,
  type AdminStats, type AdminUser,
} from "../services/endpoints";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-white p-5 flex items-center gap-4`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────────────────
const roleCfg: Record<string, { label: string; className: string }> = {
  CLIENT: { label: "Cliente", className: "bg-blue-100 text-blue-700" },
  VET:    { label: "Veterinario", className: "bg-teal-100 text-teal-700" },
  ADMIN:  { label: "Admin", className: "bg-purple-100 text-purple-700" },
};
const vetStatusCfg: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Aprobado", className: "bg-green-100 text-green-700" },
  PENDING:  { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
};

export default function AdminDashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminGetStats();
      setStats(s);
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async (p = 1, s = "", r = "") => {
    setLoading(true);
    try {
      const res = await adminListUsers(p, 20, s || undefined, r || undefined);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setSelectedUsers(new Set()); // Clear selection on page change
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers(1, "", "");
  }, [fetchStats, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(1, search, roleFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, roleFilter, fetchUsers]);

  const handleVetStatus = async (vetId: string, newStatus: "APPROVED" | "PENDING") => {
    setLoadingAction(vetId);
    try {
      await adminUpdateVetStatus(vetId, newStatus);
      setUsers(prev => prev.map(u => u.id === vetId ? { ...u, vetStatus: newStatus } : u));
      fetchStats();
    } catch { /* ignore */ } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) return;
    if (!window.confirm(`¿Estás seguro de que querés borrar ${selectedUsers.size} usuario(s)? Esta acción no se puede deshacer.`)) return;
    
    setIsDeleting(true);
    try {
      await adminBatchDeleteUsers(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      fetchUsers(page, search, roleFilter);
      fetchStats();
    } catch (error) {
      alert("Error al borrar usuarios");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === displayUsers.length && displayUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(displayUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const pendingVets = users.filter(u => u.role === "VET" && u.vetStatus === "PENDING");
  const displayUsers = activeTab === "pending" ? pendingVets : users;

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 sm:inline">
            Panel Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm font-semibold text-slate-600 sm:block">
            {user?.firstName || user?.email}
          </p>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 text-sm font-semibold text-danger hover:text-danger-dark transition-colors"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
            <StatCard label="Usuarios totales" value={stats.totalUsers} icon={Users} color="bg-slate-600" />
            <StatCard label="Veterinarios" value={stats.totalVets} icon={Stethoscope} color="bg-teal-600" />
            <StatCard label="Clientes" value={stats.totalClients} icon={Users} color="bg-blue-600" />
            <StatCard label="Vets pendientes" value={stats.pendingVets} icon={Clock} color="bg-amber-500" />
            <StatCard label="Consultas totales" value={stats.totalConsultations} icon={ClipboardList} color="bg-indigo-600" />
            <StatCard label="Completadas" value={stats.completedConsultations} icon={CheckCircle2} color="bg-green-600" />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "users" ? "bg-teal-700 text-white" : "bg-white border border-border text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todos los usuarios ({total})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "pending" ? "bg-amber-500 text-white" : "bg-white border border-border text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Vets pendientes
            {stats && stats.pendingVets > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {stats.pendingVets}
              </span>
            )}
          </button>
          <button
            onClick={() => { fetchStats(); fetchUsers(page, search, roleFilter); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </button>
        </div>

        {/* Filters (only for all users tab) */}
        {activeTab === "users" && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Todos los roles</option>
              <option value="CLIENT">Clientes</option>
              <option value="VET">Veterinarios</option>
              <option value="ADMIN">Admins</option>
            </select>
            {selectedUsers.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Borrar {selectedUsers.size}
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <Users className="h-10 w-10 text-slate-200" />
              <p className="text-sm font-semibold">
                {activeTab === "pending" ? "No hay veterinarios pendientes de aprobación 🎉" : "No se encontraron usuarios"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-500">
                      <input
                        type="checkbox"
                        checked={displayUsers.length > 0 && selectedUsers.size === displayUsers.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                      />
                    </th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Usuario</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Rol</th>
                    <th className="hidden px-5 py-3 font-semibold text-slate-500 sm:table-cell">Especialidad</th>
                    <th className="hidden px-5 py-3 font-semibold text-slate-500 sm:table-cell">Estado email</th>
                    <th className="hidden px-5 py-3 font-semibold text-slate-500 sm:table-cell">Registro</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayUsers.map(u => {
                    const isDeleted = u.email.startsWith('deleted-') && u.lastName === 'Eliminado';
                    const role = roleCfg[u.role] || roleCfg.CLIENT;
                    const vetStatus = isDeleted ? null : (u.vetStatus ? vetStatusCfg[u.vetStatus] : null);
                    const isActioning = loadingAction === u.id;
                    const isSelected = selectedUsers.has(u.id);
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-teal-50/50' : ''}`}>
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(u.id)}
                            disabled={isDeleted}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isDeleted ? 'bg-slate-200 text-slate-500' : 'bg-teal-100 text-teal-700'}`}>
                              {(u.firstName || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate font-semibold ${isDeleted ? 'text-slate-400 line-through' : 'text-ink'}`}>
                                {u.firstName || ""} {u.lastName || ""}
                              </p>
                              <p className="truncate text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${role.className}`}>
                              {role.label}
                            </span>
                            {vetStatus && !isDeleted && (
                              <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${vetStatus.className}`}>
                                {vetStatus.label}
                              </span>
                            )}
                            {isDeleted && (
                              <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-red-100 text-red-700`}>
                                Eliminado
                              </span>
                            )}
                            {isDeleted && <span className="text-xs text-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="hidden px-5 py-4 text-slate-500 sm:table-cell">
                          {u.specialty || "—"}
                        </td>
                        <td className="hidden px-5 py-4 sm:table-cell">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDeleted ? "bg-slate-100 text-slate-400" : (u.isEmailVerified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}`}>
                            {!isDeleted && (u.isEmailVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />)}
                            {isDeleted ? "Inactivo" : (u.isEmailVerified ? "Verificado" : "Pendiente")}
                          </span>
                        </td>
                        <td className="hidden px-5 py-4 text-xs text-slate-400 sm:table-cell">
                          {new Date(u.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </td>
                        <td className="px-5 py-4">
                          {u.role === "VET" && !isDeleted && (
                            <div className="flex items-center gap-2">
                              {u.vetStatus !== "APPROVED" && (
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleVetStatus(u.id, "APPROVED")}
                                  className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Aprobar
                                </button>
                              )}
                              {u.vetStatus === "APPROVED" && (
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleVetStatus(u.id, "PENDING")}
                                  className="flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                  <ShieldX className="h-3 w-3" />
                                  Revocar
                                </button>
                              )}
                              {isActioning && <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />}
                            </div>
                          )}
                          {u.role !== "VET" && <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {activeTab === "users" && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-slate-500">
                Mostrando {users.length} de {total} usuarios
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchUsers(p, search, roleFilter); }}
                  className="rounded-lg border border-border p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Pág. {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchUsers(p, search, roleFilter); }}
                  className="rounded-lg border border-border p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
