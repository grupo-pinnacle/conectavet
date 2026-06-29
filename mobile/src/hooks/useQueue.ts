import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queueService } from '@/services';
import { useQueueStore } from '@/stores/queueStore';
import type { JoinQueuePayload, QueueEntry } from '@/types';

const MY_ENTRY_KEY = ['queue', 'my-entry'] as const;

/**
 * Owner-side queue operations. Combines React Query (REST) + the WebSocket
 * store (realtime updates). When the WebSocket pushes an `ENTRY_ASSIGNED`
 * event, `queueStore.myEntry` is updated automatically; this hook just reads
 * from the store so screens stay in sync.
 */
export function useQueue() {
  const qc = useQueryClient();
  const myEntry = useQueueStore((s) => s.myEntry);
  const wsStatus = useQueueStore((s) => s.wsStatus);
  const setMyEntry = useQueueStore((s) => s.setMyEntry);

  const myEntryQuery = useQuery({
    queryKey: MY_ENTRY_KEY,
    queryFn: async () => {
      const entry = (await queueService.myEntry()) as QueueEntry | null;
      setMyEntry(entry);
      return entry;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const join = useMutation({
    mutationFn: async (payload: JoinQueuePayload) => {
      return (await queueService.join(payload)) as QueueEntry;
    },
    onSuccess: (entry) => {
      setMyEntry(entry);
      qc.invalidateQueries({ queryKey: MY_ENTRY_KEY });
    },
  });

  const cancel = useMutation({
    mutationFn: () => queueService.cancel(),
    onSuccess: () => {
      setMyEntry(null);
      qc.invalidateQueries({ queryKey: MY_ENTRY_KEY });
    },
  });

  const finalize = useMutation({
    mutationFn: (entryId: string) => queueService.finalize(entryId),
    onSuccess: () => {
      setMyEntry(null);
      qc.invalidateQueries({ queryKey: MY_ENTRY_KEY });
    },
  });

  const confirmConnection = useMutation({
    mutationFn: (entryId: string) => queueService.confirmConnection(entryId),
  });

  return {
    myEntry,
    wsStatus,
    isLoading: myEntryQuery.isLoading,
    isFetching: myEntryQuery.isFetching,
    join,
    cancel,
    finalize,
    confirmConnection,
    refetch: myEntryQuery.refetch,
  };
}
