import type { PromoCode } from "@/lib/store-config";

export type PromoFailReason =
  | "empty"
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted"
  | "wrong_plan"
  | "wrong_site";

export type PromoResolveResult =
  | { ok: true; promo: PromoCode }
  | { ok: false; reason: PromoFailReason; technical: string };

const USER_SAFE: Record<PromoFailReason, string> = {
  empty: "Введите промокод",
  not_found: "Промокод не найден",
  inactive: "Промокод неактивен",
  expired: "Срок действия промокода истёк",
  exhausted: "Лимит использований промокода исчерпан",
  wrong_plan: "Промокод не подходит к выбранному тарифу",
  wrong_site: "Промокод предназначен для другого магазина",
};

export function promoUserMessage(reason: PromoFailReason): string {
  return USER_SAFE[reason];
}

function isExhausted(promo: PromoCode): boolean {
  return promo.maxUses != null && promo.usesCount != null && promo.usesCount >= promo.maxUses;
}

/**
 * Apply a store-scoped promo even if admin `is_active` is off or the date window lapsed.
 * Still rejects unknown codes, exhausted max_uses, and plan-restricted codes.
 */
export function resolvePromoForPlan(
  codes: PromoCode[],
  code: string | null | undefined,
  planId: string,
): PromoResolveResult {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) {
    return { ok: false, reason: "empty", technical: "empty_code" };
  }

  const candidates = codes.filter((c) => c.code === normalized);
  if (!candidates.length) {
    return {
      ok: false,
      reason: "not_found",
      technical: `code_not_in_store_list:${normalized}`,
    };
  }

  const usable = candidates.filter((c) => !isExhausted(c));
  if (!usable.length) {
    const sample = candidates[0]!;
    return {
      ok: false,
      reason: "exhausted",
      technical: `uses ${sample.usesCount}/${sample.maxUses}`,
    };
  }

  const planMatch =
    usable.find((c) => !c.planIds?.length || c.planIds.includes(planId)) ??
    usable.find((c) => !c.planIds?.length);

  if (!planMatch) {
    return {
      ok: false,
      reason: "wrong_plan",
      technical: `plan=${planId}; allowed=${usable.map((c) => (c.planIds ?? []).join("|") || "*").join(",")}`,
    };
  }

  return { ok: true, promo: planMatch };
}
