import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

// Code-split: cada página se carga solo cuando el usuario la necesita
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const RegisterPage       = lazy(() => import("./pages/RegisterPage"));
const DashboardPage      = lazy(() => import("./pages/DashboardPage"));
const VetDashboardPage   = lazy(() => import("./pages/VetDashboardPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const LandingPage        = lazy(() => import("./pages/LandingPage"));
const CallPage           = lazy(() => import("./pages/CallPage"));

function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white gap-6">
      <div className="relative">
        <svg width={72} height={72} viewBox="0 0 48 48" fill="none" className="animate-[fadeIn_0.6s_ease-out]">
          <rect x="0.5" y="0.5" width="47" height="47" rx="11" fill="#0F766E" />
          <circle cx="24" cy="24" r="16" fill="white" />
          <path d="M16 28c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="20" r="2" fill="#0F766E" />
          <circle cx="30" cy="20" r="2" fill="#0F766E" />
          <path d="M20 30c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="absolute -inset-2 rounded-full bg-teal-100/50 animate-pulse" style={{ animationDuration: "2s" }} />
      </div>
      <div className="flex flex-col items-center animate-[fadeIn_0.8s_ease-out_0.2s_both]">
        <h1 className="text-heading font-extrabold tracking-tight">
          <span className="text-teal-700">Vet</span>
          <span className="text-green-600">Connect</span>
        </h1>
        <p className="text-body text-slate-500 mt-1">Telesalud veterinaria, siempre al alcance</p>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) return <LandingPage />;

  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "vet")   return <Navigate to="/vet-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white gap-4 px-6 text-center">
      <h1 className="text-3xl font-extrabold text-teal-700">404</h1>
      <p className="text-body text-slate-600">La página que buscás no existe.</p>
      <a href="/" className="text-teal-700 underline font-medium">
        Volver al inicio
      </a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/call" element={<CallPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={["owner"]}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vet-dashboard"
                element={
                  <ProtectedRoute requiredRole={["vet", "admin"]}>
                    <VetDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole={["admin"]}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
