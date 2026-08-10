import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services';
import type { FavoriteVet, Vet } from '@/types';

export function useFavorites() {
  const qc = useQueryClient();
  const key = ['favorites'] as const;

  const list = useQuery({
    queryKey: key,
    queryFn: async () => (await usersService.listFavorites()) as FavoriteVet[],
    staleTime: 30_000,
  });

  const toggle = useMutation({
    mutationFn: ({ vetId, favorited }: { vetId: string; favorited: boolean }) =>
      favorited ? usersService.removeFavorite(vetId) : usersService.addFavorite(vetId),
    onMutate: ({ vetId, favorited }) => {
      qc.setQueriesData<Vet[]>({ queryKey: ['vets'] }, (old) =>
        old?.map((v) => (v.id === vetId ? { ...v, isFavorite: !favorited } : v))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vets'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return { list, toggle };
}
