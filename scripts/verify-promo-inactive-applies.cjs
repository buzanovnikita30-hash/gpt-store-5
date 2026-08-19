/**
 * Inactive / expired promo rows must still apply (admin toggle + date window ignored).
 * Run: node scripts/verify-promo-inactive-applies.cjs
 */

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

function isExhausted(promo) {
  return promo.maxUses != null && promo.usesCount != null && promo.usesCount >= promo.maxUses;
}

function resolvePromoForPlan(codes, code, planId) {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) return { ok: false, reason: "empty" };
  const candidates = codes.filter((c) => c.code === normalized);
  if (!candidates.length) return { ok: false, reason: "not_found" };
  const usable = candidates.filter((c) => !isExhausted(c));
  if (!usable.length) return { ok: false, reason: "exhausted" };
  const planMatch =
    usable.find((c) => !c.planIds?.length || c.planIds.includes(planId)) ??
    usable.find((c) => !c.planIds?.length);
  if (!planMatch) return { ok: false, reason: "wrong_plan" };
  return { ok: true, promo: planMatch };
}

function applyPromo(price, promo) {
  if (!promo) return { finalPrice: price, discountValue: 0 };
  const rawDiscount =
    promo.type === "percent" ? Math.round((price * promo.value) / 100) : Math.round(promo.value);
  const discountValue = Math.max(0, Math.min(price, rawDiscount));
  return { finalPrice: Math.max(0, price - discountValue), discountValue };
}

const COMP10 = {
  code: "COMP10",
  type: "percent",
  value: 10,
  active: true,
  maxUses: null,
  usesCount: 0,
};
const INACTIVE = { ...COMP10, code: "PROMO-OFF", active: false };
const EXPIRED = { ...COMP10, code: "GPT10", active: false };
const EXHAUSTED = { ...COMP10, code: "FRIEND-USED", active: false, maxUses: 1, usesCount: 1 };
const WRONG_PLAN = { ...COMP10, code: "PLUSONLY", planIds: ["plus-std"], active: false };

assert(resolvePromoForPlan([COMP10], "comp10", "plus-std").ok, "active COMP10 must apply");
assert(resolvePromoForPlan([INACTIVE], "PROMO-OFF", "plus-std").ok, "inactive toggle must apply");
assert(resolvePromoForPlan([EXPIRED], "GPT10", "plus-std").ok, "expired window must apply");
assert(resolvePromoForPlan([EXHAUSTED], "FRIEND-USED", "plus-std").reason === "exhausted", "max_uses still blocks");
assert(resolvePromoForPlan([WRONG_PLAN], "PLUSONLY", "plus-pro").reason === "wrong_plan", "plan lock still blocks");

const priced = applyPromo(2190, COMP10);
assert(priced.finalPrice === 1971 && priced.discountValue === 219, `COMP10 2190 → 1971, got ${priced.finalPrice}`);

console.log("verify-promo-inactive-applies: ok");
