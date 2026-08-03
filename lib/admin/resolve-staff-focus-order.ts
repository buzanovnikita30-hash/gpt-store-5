/** Единый выбор основного заказа для staff UI (чат, clients, summary). */

export type StaffSiteSlug = "gpt-store" | "subs-store";

function createdAtMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Основной заказ в карточке клиента:
 * 1) preferredOrderId, если есть в списке (ссылка из строки заказа / «Показать этот заказ»);
 * 2) иначе самый новый по created_at DESC;
 * 3) при равном created_at — стабильный tie-break по id DESC.
 *
 * Список уже должен быть отфильтрован текущим магазином (site_slug / product).
 * siteSlug оставлен в сигнатуре для совместимости вызовов.
 */
export function resolveStaffFocusOrder<T extends { id: string; status: string; created_at: string }>(
  orders: T[],
  _siteSlug: StaffSiteSlug,
  preferredOrderId?: string | null,
): T | null {
  if (!orders.length) return null;

  const preferred = preferredOrderId?.trim();
  if (preferred) {
    const hit = orders.find((o) => o.id === preferred);
    if (hit) return hit;
  }

  const sorted = [...orders].sort((a, b) => {
    const byCreated = createdAtMs(b.created_at) - createdAtMs(a.created_at);
    if (byCreated !== 0) return byCreated;
    return b.id.localeCompare(a.id);
  });

  return sorted[0] ?? null;
}
