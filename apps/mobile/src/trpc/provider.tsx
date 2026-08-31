import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Provider de datos para mobile.
 *
 * En esta iteración los componentes usan datos mock locales (ver `app/(app)/*`).
 * En la próxima iteración esto consumirá el tRPC del backend web vía HTTP:
 *   - createTRPCReact con el AppRouter exportado desde @conectavet/api
 *   - httpBatchLink apuntando a ${EXPO_PUBLIC_API_URL}/api/trpc
 *
 * Por ahora expone solo el QueryClient, suficiente para que la app arranque
 * con NativeWind y Expo Router.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}