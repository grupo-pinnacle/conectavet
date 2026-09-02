import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User["role"][];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && user.role && !requiredRole.includes(user.role)) {
    const roleUpper = user.role.toUpperCase();
    const redirect =
      roleUpper === "ADMIN"
        ? "/admin"
        : roleUpper === "VET"
        ? "/vet-dashboard"
        : "/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
