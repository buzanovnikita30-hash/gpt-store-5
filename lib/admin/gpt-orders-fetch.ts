import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "@/types/database";

import { getSiteUUID } from "@/lib/admin/getSiteId";
import type { OrdersClientFilter } from "@/lib/admin/orders-client-filter";

export type GptAdminOrderRow = {
  id: string;
  product: string;
  plan_id: string;
  price: number;
  status: OrderStatus;
  account_email: string | null;
  created_at: string;
  user_id: string | null;
  paid_at?: string | null;
};

export type GptOrdersClientMeta = {
  label: string | null;
  resolvedUserId: string | null;
};

async function resolveGptClientFilter(
  admin: SupabaseClient,
  client: OrdersClientFilter | null | undefined,
): Promise<{
  userId: string | null;
  email: string | null;
  orderId: string | null;
  label: string | null;
}> {
  if (!client) {
    return { userId: null, email: null, orderId: null, label: null };
  }

  if (client.kind === "user") {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("id", client.userId)
      .maybeSingle();
    return {
      userId: client.userId,
      email: profile?.email?.trim().toLowerCase() ?? null,
      orderId: null,
      label: profile?.email?.trim() || client.userId,
    };
  }

  if (client.kind === "email") {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", client.email)
      .maybeSingle();
    return {
      userId: profile?.id ?? null,
      email: client.email,
      orderId: null,
      label: profile?.email?.trim() || client.email,
    };
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, account_email")
    .eq("id", client.orderId)
    .maybeSingle();
  if (!order) {
    return { userId: null, email: null, orderId: client.orderId, label: `заказ ${client.orderId.slice(0, 8)}…` };
  }
  const email = order.account_email?.trim().toLowerCase() ?? null;
  if (order.user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();
    return {
      userId: order.user_id,
      email: profile?.email?.trim().toLowerCase() ?? email,
      orderId: null,
      label: profile?.email?.trim() || email || order.user_id,
    };
  }
  return {
    userId: null,
    email,
    orderId: order.id,
    label: email || `заказ ${order.id.slice(0, 8)}…`,
  };
}

export async function fetchGptOrdersForAdmin(
  admin: SupabaseClient,
  opts: {
    filterStatus?: string;
    offset: number;
    limit: number;
    clientFilter?: OrdersClientFilter | null;
    fromIso?: string | null;
    toIso?: string | null;
    paidOnly?: boolean;
    planId?: string | null;
  },
): Promise<{
  orders: GptAdminOrderRow[];
  error: string | null;
  clientMeta: GptOrdersClientMeta | null;
}> {
  const gptSiteId = await getSiteUUID("gpt-store");
  const resolved = await resolveGptClientFilter(admin, opts.clientFilter);
  const clientMeta: GptOrdersClientMeta | null = opts.clientFilter
    ? { label: resolved.label, resolvedUserId: resolved.userId }
    : null;

  let query = admin
    .from("orders")
    .select("id, product, plan_id, price, status, account_email, created_at, user_id, paid_at")
    .not("product", "ilike", "spotify%")
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (gptSiteId) {
    query = query.or(`site_id.eq.${gptSiteId},site_id.is.null`);
  }

  const normalizedStatus =
    opts.filterStatus === "awaiting_payment" ? "pending" : opts.filterStatus?.trim();
  if (normalizedStatus && normalizedStatus !== "all") {
    query = query.eq("status", normalizedStatus);
  }

  if (opts.planId?.trim()) {
    query = query.eq("plan_id", opts.planId.trim());
  }

  if (opts.paidOnly) {
    query = query.in("status", ["paid", "activating", "waiting_client", "active"]);
  }

  if (opts.fromIso) {
    if (opts.paidOnly) {
      query = query.or(
        `paid_at.gte.${opts.fromIso},and(paid_at.is.null,created_at.gte.${opts.fromIso})`,
      );
    } else {
      query = query.gte("created_at", opts.fromIso);
    }
  }
  if (opts.toIso) {
    if (opts.paidOnly) {
      query = query.or(
        `paid_at.lte.${opts.toIso},and(paid_at.is.null,created_at.lte.${opts.toIso})`,
      );
    } else {
      query = query.lte("created_at", opts.toIso);
    }
  }

  if (opts.clientFilter) {
    const emailLit = resolved.email ? `"${resolved.email.replace(/"/g, "")}"` : null;
    if (resolved.userId && emailLit) {
      // Registered client + legacy rows without user_id but exact account_email.
      query = query.or(
        `user_id.eq.${resolved.userId},and(user_id.is.null,account_email.eq.${emailLit})`,
      );
    } else if (resolved.userId) {
      query = query.eq("user_id", resolved.userId);
    } else if (resolved.email) {
      // ilike without wildcards = case-insensitive exact match
      query = query.ilike("account_email", resolved.email);
    } else if (resolved.orderId) {
      query = query.eq("id", resolved.orderId);
    } else {
      return { orders: [], error: null, clientMeta };
    }
  }

  const { data, error } = await query;
  if (error) {
    return { orders: [], error: error.message, clientMeta };
  }

  return { orders: (data ?? []) as GptAdminOrderRow[], error: null, clientMeta };
}
