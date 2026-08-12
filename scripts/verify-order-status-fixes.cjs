/**
 * Smoke: GPT checkout reuse statuses + staff quick-reply status map + cascade sets.
 * Run: node scripts/verify-order-status-fixes.cjs
 */

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const GPT_UNPAID = ["pending", "awaiting_payment"];
const GPT_OPEN = ["paid", "activating", "waiting_client"];
const GPT_REUSABLE = [...GPT_UNPAID, ...GPT_OPEN];
const GPT_NOT_REUSE = ["active", "failed", "expired", "refunded"];

function isGptUnpaidReuseStatus(status) {
  return GPT_UNPAID.includes(String(status ?? "").trim().toLowerCase());
}

function isGptReusableCheckoutStatus(status) {
  return GPT_REUSABLE.includes(String(status ?? "").trim().toLowerCase());
}

const QUICK = [
  { label: "Приняли заказ", gptStatus: "activating", subsStatus: "processing" },
  { label: "Нужны данные", gptStatus: "waiting_client", subsStatus: "awaiting_data" },
  { label: "Готово", gptStatus: "active", subsStatus: "activated" },
  { label: "Ожидайте" },
];

function staffQuickReplyTargetStatus(reply, siteSlug) {
  const status = siteSlug === "subs-store" ? reply.subsStatus : reply.gptStatus;
  return status?.trim() || null;
}

const GPT_SIBLING_OPEN = ["paid", "activating", "waiting_client"];
const SUBS_SIBLING_OPEN = ["paid", "processing", "awaiting_data", "awaiting_operator", "activating"];

function pickPaidLikeCollapse(orders) {
  const activated = (s) => ["active", "activated", "completed"].includes(s);
  const paidLike = (s) =>
    [
      "paid",
      "activating",
      "waiting_client",
      "active",
      "processing",
      "awaiting_operator",
      "awaiting_data",
      "activated",
      "completed",
    ].includes(s);

  const groups = new Map();
  const rest = [];
  for (const o of orders) {
    if (!paidLike(o.status)) {
      rest.push(o);
      continue;
    }
    const key = o.plan_id;
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }
  const picked = [];
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const aAct = activated(a.status) ? 1 : 0;
      const bAct = activated(b.status) ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct;
      return String(b.created_at).localeCompare(String(a.created_at));
    });
    picked.push(list[0]);
  }
  return [...rest, ...picked];
}

// --- reuse ---
for (const s of GPT_REUSABLE) {
  assert(isGptReusableCheckoutStatus(s), `should reuse ${s}`);
}
for (const s of GPT_NOT_REUSE) {
  assert(!isGptReusableCheckoutStatus(s), `should NOT reuse ${s}`);
}
assert(isGptUnpaidReuseStatus("pending"));
assert(!isGptUnpaidReuseStatus("paid"), "paid must not reset to pending");

// shel.put scenario: paid sibling exists → reuse, no new twin
assert(isGptReusableCheckoutStatus("paid"), "paid open fulfillment must be reusable");

// --- quick replies ---
assert(staffQuickReplyTargetStatus(QUICK[0], "gpt-store") === "activating");
assert(staffQuickReplyTargetStatus(QUICK[0], "subs-store") === "processing");
assert(staffQuickReplyTargetStatus(QUICK[2], "gpt-store") === "active");
assert(staffQuickReplyTargetStatus(QUICK[2], "subs-store") === "activated");
assert(staffQuickReplyTargetStatus(QUICK[3], "gpt-store") === null);

// --- cascade sets ---
assert(GPT_SIBLING_OPEN.includes("paid"));
assert(!GPT_SIBLING_OPEN.includes("active"));
assert(SUBS_SIBLING_OPEN.includes("processing"));

// --- cabinet collapse (shel.put twins) ---
const collapsed = pickPaidLikeCollapse([
  {
    id: "ba43",
    plan_id: "plus-fast",
    status: "paid",
    created_at: "2026-08-08T11:32:00Z",
  },
  {
    id: "ef51",
    plan_id: "plus-fast",
    status: "active",
    created_at: "2026-08-08T11:33:00Z",
  },
  {
    id: "other",
    plan_id: "plus-std",
    status: "pending",
    created_at: "2026-08-08T12:00:00Z",
  },
]);
assert(collapsed.length === 2, `expected 2 orders, got ${collapsed.length}`);
assert(
  collapsed.some((o) => o.id === "ef51"),
  "prefer activated twin",
);
assert(!collapsed.some((o) => o.id === "ba43"), "hide paid twin of same plan");
assert(collapsed.some((o) => o.id === "other"), "keep unpaid other plan");

console.log("verify-order-status-fixes: ok");
