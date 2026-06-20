import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ backedUp: false });
    }

    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('recovery_codes')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return Response.json({ backedUp: data !== null });
  } catch {
    return Response.json({ backedUp: false });
  }
}
