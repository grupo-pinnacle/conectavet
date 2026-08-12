import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationsService, type SendMessagePayload } from '@/services';
import { connectSocket, joinConsultation, leaveConsultation } from '@/lib/socket';
import type { ChatMessage, Consultation, CreateConsultationPayload, Prescription, RateConsultationPayload } from '@/types';

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

export function useConsultationPrescriptions(consultationId: string | undefined) {
  return useQuery({
    queryKey: ['consultations', consultationId, 'prescriptions'],
    queryFn: async () =>
      (await consultationsService.getPrescriptions(consultationId!)) as Prescription[],
    enabled: Boolean(consultationId),
    staleTime: 30_000,
    refetchInterval: 15_000,
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ consultationId, payload }: { consultationId: string; payload: RateConsultationPayload }) =>
      consultationsService.rate(consultationId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] });
      qc.invalidateQueries({ queryKey: ['vets'] });
    },
  });
}

export function useConsultationMessages(consultationId: string | undefined, userId?: string) {
  const qc = useQueryClient();
  const key = ['consultations', consultationId, 'messages'] as const;
  const connectedRef = useRef(false);
  const pendingOptimisticRef = useRef<{ id: string; content: string; attachmentUrl?: string | null }[]>([]);  const [socketConnected, setSocketConnected] = useState(false);

  const list = useQuery({
    queryKey: key,
    queryFn: async () => (await consultationsService.getMessages(consultationId!)) as ChatMessage[],
    enabled: Boolean(consultationId),
    staleTime: 0,
    // Only poll while the realtime socket is NOT connected — avoids
    // duplicate traffic and re-renders during active chats.
    refetchInterval: socketConnected ? false : 5000,
  });

  // Socket connection for real-time messages
  useEffect(() => {
    if (!consultationId) return;

    let cancelled = false;
    let socketInstance: Awaited<ReturnType<typeof connectSocket>> | null = null;

    const initSocket = async () => {
      try {
        socketInstance = await connectSocket();
        if (cancelled) return;
        connectedRef.current = true;
        setSocketConnected(true);
        joinConsultation(consultationId);

        const onMessage = (message: ChatMessage) => {
          if (message.consultationId !== consultationId) return;
          qc.setQueryData<ChatMessage[]>(key, (old = []) => {
            if (old.some((m) => m.id === message.id)) return old;
            // Reemplaza TODOS los optimistas pendientes con el mismo contenido
            // y rol: así no quedan clavados en "enviando" ni se duplica el
            // mensaje si el echo llega antes que la respuesta REST.
            // Para imágenes también compara el adjunto: dos imágenes tienen
            // contenido vacío y no deben borrarse entre sí.
            const withoutOptimistic = old.filter(
              (m) =>
                !(
                  m.id.startsWith('optimistic-') &&
                  m.content === message.content &&
                  (m.attachmentUrl ?? null) === (message.attachmentUrl ?? null) &&
                  (typeof m.sender?.role === 'string'
                    ? m.sender.role === message.sender?.role
                    : true)
                )
            );
            return [...withoutOptimistic, message];
          });
        };

        const onConsultationUpdated = (updated: Consultation) => {
          if (updated.id !== consultationId) return;
          qc.setQueryData(['consultations', consultationId], updated);
        };

        const onPrescriptionNew = (prescription: Prescription) => {
          if (prescription.consultationId !== consultationId) return;
          qc.setQueryData<Prescription[]>(['consultations', consultationId, 'prescriptions'], (old = []) =>
            old.some((p) => p.id === prescription.id) ? old : [...old, prescription]
          );
        };

        socketInstance.on('message:new', onMessage);
        socketInstance.on('consultation:updated', onConsultationUpdated);
        socketInstance.on('prescription:new', onPrescriptionNew);
        // Reconexión: si el socket se cae en datos móviles inestables,
        // volvemos a habilitar el polling para no congelar el chat.
        const onDisconnect = () => setSocketConnected(false);
        const onReconnect = () => setSocketConnected(true);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('connect', onReconnect);
      } catch {
        // Socket connection failed — polling will handle it
      }
    };

    initSocket();

    return () => {
      cancelled = true;
      setSocketConnected(false);
      if (socketInstance) {
        socketInstance.off('message:new');
        socketInstance.off('consultation:updated');
        socketInstance.off('prescription:new');
        socketInstance.off('disconnect');
        socketInstance.off('connect');
      }
      if (connectedRef.current) {
        leaveConsultation(consultationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key/qc son estables; reconectar ante cambios de array rompería el socket
  }, [consultationId]);

  const send = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const msg = await consultationsService.sendMessage(consultationId!, payload);
      return msg as ChatMessage;
    },
    onMutate: async (payload: SendMessagePayload) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      const optimisticId = `optimistic-${Date.now()}`;
      pendingOptimisticRef.current.push({
        id: optimisticId,
        content: payload.content ?? '',
        attachmentUrl: payload.attachmentUrl,
      });
      qc.setQueryData<ChatMessage[]>(key, (old = []) => [
        ...old,
        {
          id: optimisticId,
          consultationId: consultationId!,
          senderId: userId ?? '',
          content: payload.content ?? '',
          attachmentUrl: payload.attachmentUrl,
          createdAt: new Date().toISOString(),
          sender: { id: userId ?? '', email: '', role: 'CLIENT' },
        } as ChatMessage,
      ]);
      return { previous };
    },
    onSuccess: (real) => {
      // Reemplaza el optimista más antiguo que coincida con el mensaje
      // confirmado (FIFO), aunque el socket esté caído: nunca queda
      // ninguno clavado en "enviando" ni se duplica.
      // Las imágenes coinciden también por adjunto (el contenido es vacío).
      const idx = pendingOptimisticRef.current.findIndex(
        (p) =>
          p.content === real.content &&
          (p.attachmentUrl ?? null) === (real.attachmentUrl ?? null)
      );
      const pending = idx >= 0 ? pendingOptimisticRef.current.splice(idx, 1)[0] : null;
      qc.setQueryData<ChatMessage[]>(key, (old = []) => {
        if (old.some((m) => m.id === real.id)) return old;
        if (!pending) return [...old, real];
        return old.map((m) => (m.id === pending.id ? real : m));
      });
    },
    onError: (_err, _payload, ctx) => {
      pendingOptimisticRef.current = [];
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {},
  });

  return { list, send };
}
