import type { SupabaseClient } from "@supabase/supabase-js";

import {
  inferGptPlanDurationMonths,
  resolveOrderSubscriptionExpiresAt,
} from "@/lib/admin/admin-subscription-label";
import {
  buildSubsOrderActivationPatch,
  subsPaymentStatusForOrderStatus,
} from "@/lib/admin/patch-subs-order-status";
import type { Database, OrderStatus } from "@/types/database";

const GPT_SIBLING_OPEN: OrderStatus[] = ["paid", "activating", "waiting_client"];
const SUBS_SIBLING_OPEN = ["paid", "processing", "awaiting_data", "awaiting_operator", "activating"] as const;

/**
 * При ручной активации заказа закрываем twin’ы того же user+plan
 * (paid/activating/waiting_client → active), чтобы карточка чата и таблица не расходились.
 */
export async function cascadeActivateGptSiblingOrders(
  admin: SupabaseClient<Database>,
  params: {
    userId: string | null | undefined;
    planId: string | null | undefined;
    excludeOrderId: string;
    planTitle?: string | null;
  },
): Promise<number> {
  const userId = params.userId?.trim();
  const planId = params.planId?.trim();
  if (!userId || !planId) return 0;

  const { data: siblings, error } = await admin
    .from("orders")
    .select("id,status,activated_at,expires_at,paid_at,created_at,plan_id")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .in("status", GPT_SIBLING_OPEN)
    .neq("id", params.excludeOrderId);

  if (error || !siblings?.length) return 0;

  const nowIso = new Date().toISOString();
  const planTitle = params.planTitle?.trim() || planId;
  let updated = 0;

  for (const row of siblings) {
    const patch: {
      status: OrderStatus;
      activated_at?: string;
      expires_at?: string;
    } = { status: "active" };

    if (!row.activated_at) patch.activated_at = nowIso;
    if (!row.expires_at) {
      const expiresAt = resolveOrderSubscriptionExpiresAt({
        activated_at: (row.activated_at as string | null) ?? nowIso,
        paid_at: (row.paid_at as string | null) ?? null,
        created_at: (row.created_at as string | null) ?? null,
        durationMonths: inferGptPlanDurationMonths(String(row.plan_id ?? planId), planTitle),
        planTitle,
      });
      if (expiresAt) patch.expires_at = expiresAt;
    }

    const { error: updErr } = await admin.from("orders").update(patch).eq("id", row.id);
    if (!updErr) updated += 1;
  }

  return updated;
}

/** Subs: twin’ы того же user+tariff → activated. */
export async function cascadeActivateSubsSiblingOrders(
  subs: SupabaseClient,
  params: {
    userId: string | null | undefined;
    tariffId: string | null | undefined;
    excludeOrderId: string;
    planTitle: string;
    durationMonths: number | null;
  },
): Promise<number> {
  const userId = params.userId?.trim();
  const tariffId = params.tariffId?.trim();
  if (!userId || !tariffId) return 0;

  const { data: siblings, error } = await subs
    .from("orders")
    .select("id,status,payment_status,activated_at,expires_at,paid_at,created_at")
    .eq("user_id", userId)
    .eq("tariff_id", tariffId)
    .in("status", [...SUBS_SIBLING_OPEN])
    .neq("id", params.excludeOrderId);

  if (error || !siblings?.length) return 0;

  const nextStatus = "activated";
  const nextPayment = subsPaymentStatusForOrderStatus(nextStatus);
  let updated = 0;

  for (const row of siblings) {
    const activation = buildSubsOrderActivationPatch(
      {
        status: String(row.status),
        activated_at: (row.activated_at as string | null) ?? null,
        expires_at: (row.expires_at as string | null) ?? null,
        paid_at: (row.paid_at as string | null) ?? null,
        created_at: (row.created_at as string | null) ?? null,
        durationMonths: params.durationMonths,
        planTitle: params.planTitle,
      },
      nextStatus,
    );

    const payload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...activation,
    };
    if (nextPayment) payload.payment_status = nextPayment;

    const { error: updErr } = await subs.from("orders").update(payload).eq("id", row.id);
    if (!updErr) updated += 1;
  }

  return updated;
}
