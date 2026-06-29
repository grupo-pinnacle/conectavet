import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petsService } from '@/services';
import type { CreatePetPayload, UpdatePetPayload, Pet, VetCard } from '@/types';

const PETS_KEY = ['pets'] as const;

export function usePets() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: PETS_KEY,
    queryFn: async () => (await petsService.list()) as Pet[],
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (payload: CreatePetPayload) => petsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PETS_KEY }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePetPayload }) =>
      petsService.update(id, payload),
    onSuccess: (updated: Pet) => {
      qc.invalidateQueries({ queryKey: PETS_KEY });
      qc.invalidateQueries({ queryKey: ['pets', updated.id] });
      qc.invalidateQueries({ queryKey: ['pets', updated.id, 'vetcard'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => petsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PETS_KEY }),
  });

  return { list, create, update, remove };
}

export function usePet(id: string | undefined) {
  return useQuery({
    queryKey: ['pets', id],
    queryFn: async () => (await petsService.getById(id!)) as Pet,
    enabled: Boolean(id),
  });
}

export function useVetCard(id: string | undefined) {
  return useQuery({
    queryKey: ['pets', id, 'vetcard'],
    queryFn: async () => (await petsService.vetCard(id!)) as VetCard,
    enabled: Boolean(id),
  });
}
