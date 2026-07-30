/**
 * Куда вести админа при клике на уведомление (колокол / страница уведомлений).
 *
 * Canonical rule: notification.site_id (slug after API normalize) → store.
 * Never infer store from current panel / URL / tariff / email.
 */

export type AdminNotificationSiteSlug = "gpt-store" | "subs-store";

/** Known GPT Supabase `sites.id` values (optional client-side map). */
export type SiteUuidMap = {
  gpt?: string | null;
  subs?: string | null;
};

/**
 * Resolve store slug from stamped site_id / site_slug on a staff alert row.
 * Accepts slugs or UUIDs when a uuid map is provided.
 * Unknown values → null (caller must not invent GPT).
 */
export function resolveAlertSiteSlug(
  siteId?: string | null,
  uuidMap?: SiteUuidMap | null,
): AdminNotificationSiteSlug | null {
  if (!siteId) return null;
  if (siteId === "subs-store" || siteId === "gpt-store") return siteId;
  if (uuidMap?.subs && siteId === uuidMap.subs) return "subs-store";
  if (uuidMap?.gpt && siteId === uuidMap.gpt) return "gpt-store";
  return null;
}

/**
 * @deprecated Prefer resolveAlertSiteSlug — this forces a slug for href builders.
 * Unknown / missing → gpt-store only when row is known-legacy null; callers should
 * pass already-normalized slug from API (`site_slug` / stamped `site_id`).
 */
export function siteSlugFromAlertSiteId(siteId?: string | null): AdminNotificationSiteSlug {
  if (siteId === "subs-store") return "subs-store";
  if (siteId === "gpt-store") return "gpt-store";
  // UUID without map cannot be resolved client-side — do not pretend it's GPT.
  // Keep gpt only for empty/legacy; UUIDs that look like UUIDs return gpt only as
  // last-resort navigation target when href already embeds ?site= from server map.
  if (siteId && /^[0-9a-f-]{36}$/i.test(siteId)) {
    console.warn("[notifications] unresolved site UUID in UI — expected API site_slug", siteId);
  }
  return siteId ? "gpt-store" : "gpt-store";
}

export type StaffPanelRoot = "/admin" | "/operator";

export function staffPanelRootFromPathname(pathname: string | null | undefined): StaffPanelRoot {
  return pathname?.startsWith("/operator") ? "/operator" : "/admin";
}

export function buildAdminNotificationHref(
  params: {
    siteSlug: AdminNotificationSiteSlug;
    entity_type?: string | null;
    entity_id?: string | null;
    type?: string | null;
  },
  staffRoot: StaffPanelRoot = "/admin",
): string {
  const { siteSlug, entity_type, entity_id, type } = params;
  const q = new URLSearchParams({ site: siteSlug });
  const eid = entity_id?.trim() ?? "";
  const et = (entity_type ?? "").toLowerCase();

  if ((et === "chat_session" || et === "chat_thread") && eid) {
    if (siteSlug === "subs-store") {
      q.set("thread_id", eid);
    } else {
      q.set("session_id", eid);
    }
    return `${staffRoot}/chat?${q.toString()}`;
  }

  if ((et === "order" || type === "new_order" || type === "payment_success" || type === "payment_failed" || type === "order_problem" || type === "order_activated" || type === "order_needs_data") && eid) {
    q.set("highlight", eid);
    return `${staffRoot}/orders?${q.toString()}`;
  }

  if (type === "new_review" || et === "review") {
    q.set("status", "pending");
    if (eid) q.set("highlight", eid);
    // Admin и operator — один и тот же раздел модерации в своей панели.
    return `${staffRoot}/reviews?${q.toString()}`;
  }

  if (type === "new_chat_message") {
    if (eid) {
      if (siteSlug === "subs-store") q.set("thread_id", eid);
      else q.set("session_id", eid);
    }
    return `${staffRoot}/chat?${q.toString()}`;
  }

  return `${staffRoot}/notifications?${q.toString()}`;
}

/** Сохранить выбранный магазин перед переходом по ссылке из уведомления. */
export function persistAdminSiteBeforeNavigate(siteSlug: AdminNotificationSiteSlug): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("admin-selected-site-slug", siteSlug);
    document.cookie = `current_site=${siteSlug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } catch {
    /* noop */
  }
}
