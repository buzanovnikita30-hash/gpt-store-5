/** Имена cookie сессии @supabase/ssr — без чтения значений. */
export function isSupabaseAuthCookieName(name: string): boolean {
  return name.includes("-auth-token");
}

export function requestHasSupabaseAuthCookie(cookies: {
  getAll: () => Array<{ name: string }>;
}): boolean {
  return cookies.getAll().some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
