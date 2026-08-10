import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services';
import type { Vet } from '@/types';

export function useVets(params?: { search?: string; online?: boolean }) {
  return useQuery({
    queryKey: ['vets', params?.search?.toLowerCase(), params?.online],
    queryFn: async () => (await usersService.listVets(params)) as Vet[],
    staleTime: 30_000,
  });
}
