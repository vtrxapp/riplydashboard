import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProfile, type CreateProfileInput } from '@/services/auth.service';
import { profileQueryKey } from './queryKeys';
import { useUiStore } from '@/stores/uiStore';
import { toErrorMessage } from '@/lib/errors';

/** Used by the onboarding screen to create the `public.users` row after a Clerk sign-up. */
export function useCreateProfile() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: CreateProfileInput) => createProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.id), profile);
      showToast(`Welcome, ${profile.name || 'there'}!`);
    },
    onError: (err) => showToast(toErrorMessage(err), 'error'),
  });
}
