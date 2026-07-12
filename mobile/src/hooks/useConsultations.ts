import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationsService } from '@/services';
import type { ChatMessage, Consultation, CreateConsultationPayload, RateConsultationPayload } from '@/types';

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

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsultationPayload) =>
      consultationsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations'] }),
  });
}

export function useRateConsultation() {
  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: RateConsultationPayload }) =>
      consultationsService.rate(entryId, payload),
  });
}

export function useConsultationMessages(consultationId: string | undefined) {
  const qc = useQueryClient();
  const key = ['consultations', consultationId, 'messages'] as const;

  const list = useQuery({
    queryKey: key,
    queryFn: async () => (await consultationsService.getMessages(consultationId!)) as ChatMessage[],
    enabled: Boolean(consultationId),
    staleTime: 0,
    refetchInterval: 3000,
  });

  const send = useMutation({
    mutationFn: (content: string) => consultationsService.sendMessage(consultationId!, content),
    onMutate: async (content: string) => {
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        consultationId: consultationId!,
        userId: '',
        role: 'USER',
        content,
        createdAt: new Date().toISOString(),
      };
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      qc.setQueryData<ChatMessage[]>(key, (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { list, send };
}
