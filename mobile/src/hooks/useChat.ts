import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services';
import type { Conversation, CreateConversationPayload, Message } from '@/types';

const CONVERSATIONS_KEY = ['conversations'] as const;

export function useConversations() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => (await chatService.listConversations()) as Conversation[],
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (payload: CreateConversationPayload) => chatService.createConversation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });

  const archive = useMutation({
    mutationFn: (id: string) => chatService.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });

  return { list, create, archive };
}

export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient();
  const key = ['conversations', conversationId, 'messages'] as const;

  const list = useQuery({
    queryKey: key,
    queryFn: async () => (await chatService.getMessages(conversationId!)) as Message[],
    enabled: Boolean(conversationId),
    staleTime: 0,
  });

  const send = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(conversationId!, content),
    onMutate: async (content: string) => {
      // Optimistic UI: insert the user message immediately
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: conversationId!,
        role: 'USER',
        content,
        tokenInput: 0,
        tokenOutput: 0,
        costUsd: 0,
        flagged: false,
        createdAt: new Date().toISOString(),
      };
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);
      qc.setQueryData<Message[]>(key, (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { list, send };
}
