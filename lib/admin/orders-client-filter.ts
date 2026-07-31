/**
 * Staff orders list: stable client filter from ?client=.
 *
 * Priority:
 * 1) UUID → orders.user_id (profiles.id / auth user id)
 * 2) email:<exact> → exact email match for guest/legacy rooms
 * 3) order:<uuid> → resolve order → user_id, else that single order
 */

export type OrdersClientFilter =
  | { kind: "user"; userId: string }
  | { kind: "email"; email: string }
  | { kind: "order"; orderId: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Parse ?client= from URL. Rejects ambiguous / partial values. */
export function parseOrdersClientParam(
  raw: string | null | undefined,
): OrdersClientFilter | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (value.startsWith("email:")) {
    const email = value.slice("email:".length).trim().toLowerCase();
    if (!email || !email.includes("@") || email.includes("%") || email.includes("*")) {
      return null;
    }
    return { kind: "email", email };
  }

  if (value.startsWith("order:")) {
    const orderId = value.slice("order:".length).trim();
    if (!isUuid(orderId)) return null;
    return { kind: "order", orderId };
  }

  if (isUuid(value)) {
    return { kind: "user", userId: value };
  }

  return null;
}

/** Build ?client= value for staff links from chat room / profile. */
export function buildOrdersClientParam(opts: {
  clientId: string | null | undefined;
  profileId?: string | null;
  email?: string | null;
}): string | null {
  const clientId = (opts.clientId ?? "").trim();
  if (clientId && isUuid(clientId)) return clientId;

  const profileId = (opts.profileId ?? "").trim();
  if (profileId && isUuid(profileId)) return profileId;

  if (clientId.startsWith("order:") && isUuid(clientId.slice("order:".length))) {
    return clientId;
  }

  if (clientId.startsWith("email:")) {
    const email = clientId.slice("email:".length).trim().toLowerCase();
    if (email.includes("@")) return `email:${email}`;
  }

  const email = (opts.email ?? "").trim().toLowerCase();
  if (email.includes("@")) return `email:${email}`;

  return null;
}

export function ordersClientParamToSearchValue(filter: OrdersClientFilter): string {
  if (filter.kind === "user") return filter.userId;
  if (filter.kind === "email") return `email:${filter.email}`;
  return `order:${filter.orderId}`;
}
