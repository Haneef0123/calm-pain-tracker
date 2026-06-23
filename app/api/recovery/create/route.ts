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

  // updateUserById changes the underlying auth credentials, so the browser's
  // anonymous session cookie is no longer valid. Re-sign in immediately with
  // the new synthetic credentials so the current device keeps a fresh session.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: code,
  });

  if (signInError) {
    console.error('Failed to refresh session after recovery upgrade:', signInError);
    return Response.json({ error: 'Failed to refresh session' }, { status: 500 });
  }

  // Upsert after the session refresh so a cookie-sync failure never leaves
  // the current device signed out after writing a successful recovery row.
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
