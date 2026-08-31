import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-2xl bg-red-50 p-8 max-w-md w-full border border-red-100 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-red-800">Ups, algo salió mal</h2>
            <p className="mb-6 text-sm text-red-600">
              Ocurrió un error inesperado al cargar esta sección.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
