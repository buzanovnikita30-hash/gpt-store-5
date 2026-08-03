/**
 * Server-side admin dashboard analytics for a Moscow-aligned period.
 * GPT + Subs paths stay separate (different Supabase projects).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardPeriod } from "@/lib/admin/dashboard-period";
import { resolveGptOrderPlanLabel } from "@/lib/admin/gpt-order-plan-label";
import { formatSubsTariffDisplayLabel } from "@/lib/admin/subs-tariff-display-label";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

const GPT_PAID_STATUSES = ["paid", "activating", "waiting_client", "active"] as const;
const GPT_CANCELLED = ["failed", "expired"] as const;
const GPT_REFUNDED = ["refunded"] as const;
const GPT_IN_PROGRESS = ["paid", "activating", "waiting_client"] as const;

const SUBS_PAID_PAYMENT = "paid";
const SUBS_IN_PROGRESS = ["paid", "processing", "awaiting_data", "awaiting_operator"] as const;
const SUBS_CANCELLED = ["cancelled", "problem"] as const;
const SUBS_REFUNDED_PAYMENT = "refunded";

export type DashboardTariffRow = {
  key: string;
  siteSlug: "gpt-store" | "subs-store";
  label: string;
  created: number;
  paid: number;
  revenue: number;
  avgCheck: number;
  paidShare: number;
  cancelled: number;
  refunded: number;
};

export type DashboardStatusRow = {
  status: string;
  count: number;
};

export type DashboardPeriodStats = {
  siteSlug: "gpt-store" | "subs-store";
  period: DashboardPeriod;
  created: number;
  paid: number;
  inProgress: number;
  cancelled: number;
  refunded: number;
  revenue: number;
  avgCheck: number;
  byStatus: DashboardStatusRow[];
  byTariff: DashboardTariffRow[];
};

function applyCreatedRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  fromIso: string | null,
  toIso: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (fromIso) q = q.gte("created_at", fromIso);
  if (toIso) q = q.lte("created_at", toIso);
  return q;
}

function applyPaidRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  fromIso: string | null,
  toIso: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // Prefer paid_at; include legacy paid rows with null paid_at via created_at fallback
  // is handled in post-filter for accuracy without inventing dates.
  if (fromIso) q = q.or(`paid_at.gte.${fromIso},and(paid_at.is.null,created_at.gte.${fromIso})`);
  if (toIso) q = q.or(`paid_at.lte.${toIso},and(paid_at.is.null,created_at.lte.${toIso})`);
  return q;
}

function inPaidWindow(
  paidAt: string | null | undefined,
  createdAt: string,
  fromIso: string | null,
  toIso: string | null,
): boolean {
  const ts = paidAt?.trim() ? paidAt : createdAt;
  const ms = new Date(ts).getTime();
  if (!Number.isFinite(ms)) return false;
  if (fromIso && ms < new Date(fromIso).getTime()) return false;
  if (toIso && ms > new Date(toIso).getTime()) return false;
  return true;
}

export async function loadGptDashboardPeriodStats(
  admin: Admin,
  period: DashboardPeriod,
): Promise<DashboardPeriodStats> {
  const fromIso = period.fromIso;
  const toIso = period.toIso;

  let createdQ = admin
    .from("orders")
    .select("id, status, plan_id, plan_name, product, price, created_at, paid_at")
    .not("product", "ilike", "spotify%");
  createdQ = applyCreatedRange(createdQ, fromIso, toIso);

  let paidPoolQ = admin
    .from("orders")
    .select("id, status, plan_id, plan_name, product, price, created_at, paid_at")
    .not("product", "ilike", "spotify%")
    .in("status", [...GPT_PAID_STATUSES, ...GPT_REFUNDED]);
  // Broad fetch then filter by effective payment date in JS (paid_at ?? created_at).
  if (fromIso) {
    const earliest = new Date(new Date(fromIso).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    paidPoolQ = paidPoolQ.gte("created_at", earliest);
  }

  const [{ data: createdRows }, { data: paidPool }] = await Promise.all([createdQ, paidPoolQ]);

  const createdList = createdRows ?? [];
  const paidList = (paidPool ?? []).filter(
    (o) =>
      GPT_PAID_STATUSES.includes(o.status as (typeof GPT_PAID_STATUSES)[number]) &&
      inPaidWindow(o.paid_at, o.created_at, fromIso, toIso),
  );
  const refundedList = (paidPool ?? []).filter(
    (o) =>
      o.status === "refunded" && inPaidWindow(o.paid_at, o.created_at, fromIso, toIso),
  );

  const created = createdList.length;
  const paid = paidList.length;
  const inProgress = createdList.filter((o) =>
    GPT_IN_PROGRESS.includes(o.status as (typeof GPT_IN_PROGRESS)[number]),
  ).length;
  const cancelled = createdList.filter((o) =>
    GPT_CANCELLED.includes(o.status as (typeof GPT_CANCELLED)[number]),
  ).length;
  const refunded = refundedList.length;
  const revenue = paidList.reduce((s, o) => s + Number(o.price ?? 0), 0);
  const avgCheck = paid > 0 ? Math.round(revenue / paid) : 0;

  const statusMap = new Map<string, number>();
  for (const o of createdList) {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  }
  const byStatus = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const tariffMap = new Map<
    string,
    { label: string; created: number; paid: number; revenue: number; cancelled: number; refunded: number }
  >();
  for (const o of createdList) {
    const key = String(o.plan_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: resolveGptOrderPlanLabel(o),
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.created += 1;
    if (GPT_CANCELLED.includes(o.status as (typeof GPT_CANCELLED)[number])) cur.cancelled += 1;
    tariffMap.set(key, cur);
  }
  for (const o of paidList) {
    const key = String(o.plan_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: resolveGptOrderPlanLabel(o),
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.paid += 1;
    cur.revenue += Number(o.price ?? 0);
    tariffMap.set(key, cur);
  }
  for (const o of refundedList) {
    const key = String(o.plan_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: resolveGptOrderPlanLabel(o),
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.refunded += 1;
    tariffMap.set(key, cur);
  }

  const byTariff: DashboardTariffRow[] = [...tariffMap.entries()]
    .map(([key, v]) => ({
      key,
      siteSlug: "gpt-store" as const,
      label: v.label,
      created: v.created,
      paid: v.paid,
      revenue: v.revenue,
      avgCheck: v.paid > 0 ? Math.round(v.revenue / v.paid) : 0,
      paidShare: paid > 0 ? Math.round((v.paid / paid) * 1000) / 10 : 0,
      cancelled: v.cancelled,
      refunded: v.refunded,
    }))
    .sort((a, b) => b.paid - a.paid || b.revenue - a.revenue);

  return {
    siteSlug: "gpt-store",
    period,
    created,
    paid,
    inProgress,
    cancelled,
    refunded,
    revenue,
    avgCheck,
    byStatus,
    byTariff,
  };
}

export async function loadSubsDashboardPeriodStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subs: SupabaseClient<any>,
  period: DashboardPeriod,
): Promise<DashboardPeriodStats> {
  const fromIso = period.fromIso;
  const toIso = period.toIso;

  let createdQ = subs
    .from("orders")
    .select(
      "id, status, payment_status, tariff_id, final_price, created_at, paid_at, customer_email",
    );
  createdQ = applyCreatedRange(createdQ, fromIso, toIso);

  let paidPoolQ = subs
    .from("orders")
    .select(
      "id, status, payment_status, tariff_id, final_price, created_at, paid_at, customer_email",
    )
    .or(`payment_status.eq.${SUBS_PAID_PAYMENT},payment_status.eq.${SUBS_REFUNDED_PAYMENT}`);
  if (fromIso) {
    const earliest = new Date(new Date(fromIso).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    paidPoolQ = paidPoolQ.gte("created_at", earliest);
  }

  const [{ data: createdRows }, { data: paidPool }] = await Promise.all([createdQ, paidPoolQ]);
  const createdList = createdRows ?? [];
  const paidList = (paidPool ?? []).filter(
    (o) =>
      o.payment_status === SUBS_PAID_PAYMENT &&
      inPaidWindow(o.paid_at, o.created_at, fromIso, toIso),
  );
  const refundedList = (paidPool ?? []).filter(
    (o) =>
      o.payment_status === SUBS_REFUNDED_PAYMENT &&
      inPaidWindow(o.paid_at, o.created_at, fromIso, toIso),
  );

  const tariffIds = [
    ...new Set(
      [...createdList, ...paidList]
        .map((o) => o.tariff_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const tariffTitleById = new Map<string, string>();
  if (tariffIds.length) {
    const { data: tariffs } = await subs
      .from("tariffs")
      .select("id,title,slug,category,duration_months")
      .in("id", tariffIds);
    for (const t of tariffs ?? []) {
      if (t.id) tariffTitleById.set(t.id, formatSubsTariffDisplayLabel(t));
    }
  }

  const created = createdList.length;
  const paid = paidList.length;
  const inProgress = createdList.filter((o) =>
    SUBS_IN_PROGRESS.includes(o.status as (typeof SUBS_IN_PROGRESS)[number]),
  ).length;
  const cancelled = createdList.filter((o) =>
    SUBS_CANCELLED.includes(o.status as (typeof SUBS_CANCELLED)[number]),
  ).length;
  const refunded = refundedList.length;
  const revenue = paidList.reduce((s, o) => s + Number(o.final_price ?? 0), 0);
  const avgCheck = paid > 0 ? Math.round(revenue / paid) : 0;

  const statusMap = new Map<string, number>();
  for (const o of createdList) {
    statusMap.set(String(o.status), (statusMap.get(String(o.status)) ?? 0) + 1);
  }
  const byStatus = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const tariffMap = new Map<
    string,
    { label: string; created: number; paid: number; revenue: number; cancelled: number; refunded: number }
  >();
  for (const o of createdList) {
    const key = String(o.tariff_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: tariffTitleById.get(key) ?? key,
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.created += 1;
    if (SUBS_CANCELLED.includes(o.status as (typeof SUBS_CANCELLED)[number])) cur.cancelled += 1;
    tariffMap.set(key, cur);
  }
  for (const o of paidList) {
    const key = String(o.tariff_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: tariffTitleById.get(key) ?? key,
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.paid += 1;
    cur.revenue += Number(o.final_price ?? 0);
    tariffMap.set(key, cur);
  }
  for (const o of refundedList) {
    const key = String(o.tariff_id || "unknown");
    const cur = tariffMap.get(key) ?? {
      label: tariffTitleById.get(key) ?? key,
      created: 0,
      paid: 0,
      revenue: 0,
      cancelled: 0,
      refunded: 0,
    };
    cur.refunded += 1;
    tariffMap.set(key, cur);
  }

  const byTariff: DashboardTariffRow[] = [...tariffMap.entries()]
    .map(([key, v]) => ({
      key,
      siteSlug: "subs-store" as const,
      label: v.label,
      created: v.created,
      paid: v.paid,
      revenue: v.revenue,
      avgCheck: v.paid > 0 ? Math.round(v.revenue / v.paid) : 0,
      paidShare: paid > 0 ? Math.round((v.paid / paid) * 1000) / 10 : 0,
      cancelled: v.cancelled,
      refunded: v.refunded,
    }))
    .sort((a, b) => b.paid - a.paid || b.revenue - a.revenue);

  return {
    siteSlug: "subs-store",
    period,
    created,
    paid,
    inProgress,
    cancelled,
    refunded,
    revenue,
    avgCheck,
    byStatus,
    byTariff,
  };
}

// silence unused helper warning if tree-shaken oddly
void applyPaidRange;
