/**
 * Helper to resolve site UUID from slug (and reverse).
 * Used in admin server pages/routes where DB columns expect UUID (not text slug).
 * Caches per-request since module-level cache persists across serverless cold starts.
 */

import { tryCreateAdminClient } from "@/lib/supabase/server";

const siteIdPromises = new Map<string, Promise<string | null>>();
const siteSlugByIdPromises = new Map<string, Promise<"gpt-store" | "subs-store" | null>>();

/** Returns UUID of the site for the given slug, or null if not found / sites table missing. */
export async function getSiteUUID(slug: string): Promise<string | null> {
  if (!slug) return null;
  const cached = siteIdPromises.get(slug);
  if (cached) return cached;

  const lookup = (async () => {
    try {
      const admin = tryCreateAdminClient();
      if (!admin) return null;
      const { data, error } = await admin
        .from("sites")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return null;
      return data.id as string;
    } catch {
      return null;
    }
  })();

  siteIdPromises.set(slug, lookup);
  const siteId = await lookup;
  if (!siteId) siteIdPromises.delete(slug);
  return siteId;
}

/**
 * Maps notifications.site_id UUID → canonical store slug.
 * Never defaults to gpt-store for unknown UUIDs.
 */
export async function getSiteSlugByUUID(
  siteId: string | null | undefined,
): Promise<"gpt-store" | "subs-store" | null> {
  if (!siteId) return null;
  if (siteId === "gpt-store" || siteId === "subs-store") return siteId;

  const cached = siteSlugByIdPromises.get(siteId);
  if (cached) return cached;

  const lookup = (async () => {
    try {
      const admin = tryCreateAdminClient();
      if (!admin) return null;
      const { data, error } = await admin
        .from("sites")
        .select("slug")
        .eq("id", siteId)
        .maybeSingle();
      if (error || !data?.slug) return null;
      if (data.slug === "gpt-store" || data.slug === "subs-store") return data.slug;
      return null;
    } catch {
      return null;
    }
  })();

  siteSlugByIdPromises.set(siteId, lookup);
  const slug = await lookup;
  if (!slug) siteSlugByIdPromises.delete(siteId);
  return slug;
}

/** Resolve staff-facing site slug from a GPT notifications row (UUID or null). */
export async function resolveGptNotificationSiteSlug(
  siteId: string | null | undefined,
): Promise<"gpt-store" | "subs-store" | null> {
  if (!siteId) return "gpt-store"; // legacy null rows are GPT-era
  return getSiteSlugByUUID(siteId);
}
