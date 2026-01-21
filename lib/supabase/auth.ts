import { cache } from 'react';
import { createClient } from './server';

export const getSession = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getSession();
});

export const getUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
