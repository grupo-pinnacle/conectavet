import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyConsultations } from '../services/endpoints';
import { getCachedConsultations } from '../services/chatStore';

export type ChatRole = 'client' | 'vet';

export const consultationsKey = (role: ChatRole) => ['consultations', role] as const;

/**
 * Lista de consultas del usuario, ahora vía React Query (P2-4). La caché de
 * módulo (`chatStore`) sigue como `initialData` para hidratar al instante al
 * volver a la sección, sin spinner. Los eventos de socket invalidan esta query
 * (ver useChatSocket en cada sección), así que no hacemos polling manual.
 */
export function useConsultations(role: ChatRole) {
  return useQuery({
    queryKey: consultationsKey(role),
    queryFn: getMyConsultations,
    initialData: () => getCachedConsultations() ?? undefined,
    staleTime: 30_000,
  });
}

export function useInvalidateConsultations(role: ChatRole) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: consultationsKey(role) });
}
