import { useAuth } from "../hooks/useAuth";

export default function DevModeBadge() {
  const { isDevMode } = useAuth();

  if (!isDevMode) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 rounded-full bg-yellow-400 px-4 py-2 text-xs font-bold text-yellow-900 shadow-lg md:bottom-4">
      ⚡ Modo Desarrollo — Sin backend
    </div>
  );
}
