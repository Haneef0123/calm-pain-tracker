import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCode, formatGrouped } from '@/lib/recovery/code';
import bcrypt from 'bcryptjs';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const domain = process.env.RECOVERY_SYNTHETIC_EMAIL_DOMAIN;
  if (!domain) {
    console.error('RECOVERY_SYNTHETIC_EMAIL_DOMAIN is not set');
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const syntheticEmail = `${user.id}@${domain}`;

  const adminClient = createAdminClient();

  // Upgrade anonymous account to permanent by setting synthetic email + code as password.
  // email_confirm: true skips the confirmation email entirely.
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    email: syntheticEmail,
    password: code,
    email_confirm: true,
  });

  if (updateError) {
    console.error('Failed to upgrade user:', updateError);
    return Response.json({ error: 'Failed to create recovery code' }, { status: 500 });
  }

  // Upsert so regenerating replaces the previous code immediately
  const { error: dbError } = await adminClient
    .from('recovery_codes')
    .upsert(
      { user_id: user.id, code_hash: codeHash, synthetic_email: syntheticEmail },
      { onConflict: 'user_id' }
    );

  if (dbError) {
    console.error('Failed to store code hash:', dbError);
    return Response.json({ error: 'Failed to store recovery code' }, { status: 500 });
  }

  return Response.json({ code: formatGrouped(code) });
}
