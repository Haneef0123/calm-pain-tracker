import { cache } from 'react';
import { createClient } from './server';

// Server-side auth helpers.
// Use getUser() for authorization-sensitive operations (verifies with Supabase).
// Avoid getSession() on the server for security decisions.

export const getUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
