import { useMutation, useQuery } from '@tanstack/react-query';
import { consultationsService } from '@/services';
import type { Consultation, RateConsultationPayload } from '@/types';

export function useConsultationHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['consultations', 'my-history', params],
    queryFn: async () =>
      (await consultationsService.myHistory(params)) as Consultation[],
    staleTime: 30_000,
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: ['consultations', id],
    queryFn: async () => (await consultationsService.getById(id!)) as Consultation,
    enabled: Boolean(id),
  });
}

export function useRateConsultation() {
  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: RateConsultationPayload }) =>
      consultationsService.rate(entryId, payload),
  });
}

export function useConsultationPing() {
  return useMutation({
    mutationFn: (entryId: string) => consultationsService.ping(entryId),
  });
}
