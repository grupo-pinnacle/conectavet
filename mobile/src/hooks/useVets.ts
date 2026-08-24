import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersService } from '@/services';
import type { Vet } from '@/types';

export function useVets(params?: {
  search?: string;
  online?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'recent';
}) {
  return useQuery({
    queryKey: ['vets', params?.search?.toLowerCase(), params?.online, params?.minRating, params?.sortBy],
    queryFn: async () => (await usersService.listVets(params)) as Vet[],
    staleTime: 30_000,
    // Al filtrar/buscar muestra la lista anterior en vez de volver a "cargando"
    placeholderData: keepPreviousData,
  });
}
