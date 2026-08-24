import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfilePayload, User } from '@/types';

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateMe(payload),
    onSuccess: async (res) => {
      const updated = res as unknown as User;
      await updateUser(updated);
      qc.invalidateQueries({ queryKey: ['vets'] });
    },
  });
}
