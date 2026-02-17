
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getAnalyticsAdminEmails(): string[] {
  const fromEnv = process.env.ANALYTICS_ADMIN_EMAILS;

  const emails = (fromEnv ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);

  return emails.length > 0 ? emails : [];
}

export function isAnalyticsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return getAnalyticsAdminEmails().includes(normalizeEmail(email));
}
