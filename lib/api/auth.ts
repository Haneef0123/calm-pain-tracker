import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/api/errors';

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError('UNAUTHORIZED', 'You must be signed in to continue.', 401);
  }

  return {
    supabase,
    user,
  };
}
