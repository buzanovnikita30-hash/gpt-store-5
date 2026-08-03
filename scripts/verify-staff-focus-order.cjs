/**
 * Smoke: основной заказ = newest created_at (preferred override).
 * Run: node scripts/verify-staff-focus-order.cjs
 */
function resolveStaffFocusOrder(orders, _siteSlug, preferredOrderId) {
  if (!orders.length) return null;
  const preferred = preferredOrderId?.trim();
  if (preferred) {
    const hit = orders.find((o) => o.id === preferred);
    if (hit) return hit;
  }
  const sorted = [...orders].sort((a, b) => {
    const byCreated = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (byCreated !== 0) return byCreated;
    return b.id.localeCompare(a.id);
  });
  return sorted[0] ?? null;
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

{
  // a5699906@gmail.com (Spotify): newer awaiting_payment + older paid
  const list = [
    {
      id: "b8077ba2-0269-41f5-8dea-0e0ead9605d0",
      status: "awaiting_payment",
      created_at: "2026-08-03T09:20:32.153Z",
    },
    {
      id: "881c2b31-ff7b-4d0c-9b6c-99697d33e4b5",
      status: "paid",
      created_at: "2026-08-03T09:12:38.839Z",
    },
  ];
  const focus = resolveStaffFocusOrder(list, "subs-store");
  assert(
    focus?.id === "b8077ba2-0269-41f5-8dea-0e0ead9605d0",
    "a5699906: newest awaiting_payment must be focus",
  );
}

{
  // nataliach558: newer active beats older waiting_client (by created_at)
  const list = [
    {
      id: "3e15ddb9-4fd9-462d-a552-f15c0e4017ac",
      status: "active",
      created_at: "2026-07-24T09:25:42.908Z",
    },
    {
      id: "16db332a-931a-4750-af21-1b82ba75f2ca",
      status: "waiting_client",
      created_at: "2026-07-24T09:20:20.089Z",
    },
  ];
  const focus = resolveStaffFocusOrder(list, "gpt-store");
  assert(
    focus?.id === "3e15ddb9-4fd9-462d-a552-f15c0e4017ac",
    "newest by created_at wins even if older needs action",
  );
}

{
  const list = [
    { id: "new", status: "waiting_client", created_at: "2026-07-01T00:00:00Z" },
    { id: "old", status: "active", created_at: "2026-01-01T00:00:00Z" },
  ];
  assert(resolveStaffFocusOrder(list, "gpt-store")?.id === "new", "newer wins");
}

{
  const list = [
    { id: "a", status: "active", created_at: "2026-07-01T00:00:00Z" },
    { id: "b", status: "waiting_client", created_at: "2026-06-01T00:00:00Z" },
  ];
  assert(
    resolveStaffFocusOrder(list, "gpt-store", "b")?.id === "b",
    "preferred order id wins",
  );
}

{
  const list = [
    { id: "zzz", status: "paid", created_at: "2026-07-01T00:00:00Z" },
    { id: "aaa", status: "paid", created_at: "2026-07-01T00:00:00Z" },
  ];
  assert(
    resolveStaffFocusOrder(list, "gpt-store")?.id === "zzz",
    "tie-break by id DESC",
  );
}

console.log("verify-staff-focus-order: ok");
