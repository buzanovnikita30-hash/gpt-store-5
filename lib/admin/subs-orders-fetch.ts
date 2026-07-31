import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrdersClientFilter } from "@/lib/admin/orders-client-filter";
import { applySubsOrdersStatusFilter } from "@/lib/admin/subs-orders-query";
import { formatSubsTariffDisplayLabel } from "@/lib/admin/subs-tariff-display-label";

const ORDERS_SELECT =
  "id,status,payment_status,final_price,customer_email,created_at,user_id,tariff_id";

export type SubsAdminOrderRow = {
  id: string;
  status: string;
  payment_status: string;
  final_price: number;
  customer_email: string | null;
  created_at: string;
  user_id: string | null;
  tariff_id: string | null;
  tariffTitle: string;
  profileEmail: string | null;
  profileName: string | null;
};

export type SubsOrdersClientMeta = {
  label: string | null;
  resolvedUserId: string | null;
};

async function resolveSubsClientFilter(
  subs: SupabaseClient,
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
    const { data: authUser } = await subs.auth.admin.getUserById(client.userId);
    const authEmail = authUser.user?.email?.trim().toLowerCase() ?? null;
    const { data: profile } = await subs
      .from("profiles")
      .select("id, email, full_name, username")
      .eq("id", client.userId)
      .maybeSingle();
    const email = profile?.email?.trim().toLowerCase() || authEmail;
    return {
      userId: client.userId,
      email,
      orderId: null,
      label: profile?.email?.trim() || authEmail || client.userId,
    };
  }

  if (client.kind === "email") {
    const { data: profile } = await subs
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

  const { data: order } = await subs
    .from("orders")
    .select("id, user_id, customer_email, account_email")
    .eq("id", client.orderId)
    .maybeSingle();
  if (!order) {
    return { userId: null, email: null, orderId: client.orderId, label: `заказ ${client.orderId.slice(0, 8)}…` };
  }
  const email =
    order.customer_email?.trim().toLowerCase() ||
    order.account_email?.trim().toLowerCase() ||
    null;
  if (order.user_id) {
    return {
      userId: order.user_id,
      email,
      orderId: null,
      label: email || order.user_id,
    };
  }
  return {
    userId: null,
    email,
    orderId: order.id,
    label: email || `заказ ${order.id.slice(0, 8)}…`,
  };
}

export async function fetchSubsOrdersForAdmin(
  subs: SupabaseClient,
  opts: {
    filterStatus?: string;
    offset: number;
    limit: number;
    clientFilter?: OrdersClientFilter | null;
  },
): Promise<{
  orders: SubsAdminOrderRow[];
  error: string | null;
  clientMeta: SubsOrdersClientMeta | null;
}> {
  const resolved = await resolveSubsClientFilter(subs, opts.clientFilter);
  const clientMeta: SubsOrdersClientMeta | null = opts.clientFilter
    ? { label: resolved.label, resolvedUserId: resolved.userId }
    : null;

  let q = subs
    .from("orders")
    .select(ORDERS_SELECT)
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  q = applySubsOrdersStatusFilter(q, opts.filterStatus);

  if (opts.clientFilter) {
    const emailLit = resolved.email ? `"${resolved.email.replace(/"/g, "")}"` : null;
    if (resolved.userId && emailLit) {
      q = q.or(
        `user_id.eq.${resolved.userId},and(user_id.is.null,customer_email.eq.${emailLit})`,
      );
    } else if (resolved.userId) {
      q = q.eq("user_id", resolved.userId);
    } else if (emailLit) {
      q = q.or(`customer_email.eq.${emailLit},account_email.eq.${emailLit}`);
    } else if (resolved.orderId) {
      q = q.eq("id", resolved.orderId);
    } else {
      return { orders: [], error: null, clientMeta };
    }
  }

  const { data: rawOrders, error } = await q;

  if (error) {
    return { orders: [], error: error.message, clientMeta };
  }

  const rows = rawOrders ?? [];
  const tariffIds = [
    ...new Set(rows.map((r) => r.tariff_id).filter((id): id is string => Boolean(id))),
  ];
  const userIds = [
    ...new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];

  const tariffTitleById = new Map<string, string>();
  if (tariffIds.length > 0) {
    const { data: tariffs } = await subs
      .from("tariffs")
      .select("id,title,slug,category,duration_months")
      .in("id", tariffIds);
    for (const t of tariffs ?? []) {
      if (t.id) {
        tariffTitleById.set(t.id, formatSubsTariffDisplayLabel(t));
      }
    }
  }

  const profileByUserId = new Map<string, { email: string | null; full_name: string | null }>();
  if (userIds.length > 0) {
    const profilesExtended = await subs
      .from("profiles")
      .select("id,email,full_name,username")
      .in("id", userIds);
    const profilesRes =
      profilesExtended.error && /full_name/i.test(profilesExtended.error.message)
        ? await subs.from("profiles").select("id,email,username").in("id", userIds)
        : profilesExtended;
    for (const p of profilesRes.data ?? []) {
      if (!p.id) continue;
      profileByUserId.set(p.id, {
        email: (p.email as string | null) ?? null,
        full_name:
          ("full_name" in p ? (p.full_name as string | null) : null) ??
          (p.username as string | null) ??
          null,
      });
    }
  }

  const orders: SubsAdminOrderRow[] = rows.map((row) => {
    const prof = row.user_id ? profileByUserId.get(row.user_id) : undefined;
    const tariffTitle = (row.tariff_id ? tariffTitleById.get(row.tariff_id) : null) ?? "—";

    return {
      id: row.id,
      status: row.status,
      payment_status: row.payment_status,
      final_price: Number(row.final_price ?? 0),
      customer_email: row.customer_email,
      created_at: row.created_at,
      user_id: row.user_id,
      tariff_id: row.tariff_id,
      tariffTitle,
      profileEmail: prof?.email ?? null,
      profileName: prof?.full_name ?? null,
    };
  });

  return { orders, error: null, clientMeta };
}
