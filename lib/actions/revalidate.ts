'use server';

import { revalidateTag } from 'next/cache';
import { getUser } from '@/lib/supabase/auth';

export async function revalidatePainEntries() {
  const { data: { user } } = await getUser();
  
  if (user?.id) {
    revalidateTag(`pain-entries-${user.id}`);
  }
}
