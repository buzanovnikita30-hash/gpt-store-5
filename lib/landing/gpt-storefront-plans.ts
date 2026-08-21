import {
  CHATGPT_PLANS,
  GPT_PUBLIC_HIDDEN_PLAN_IDS,
  type ExtendedPlan,
} from "@/lib/chatgpt-data";
import { applyHeroPromoDisplayToGptPlans } from "@/lib/landing/hero-promo-landing-discount";

/** Публичный каталог GPT STORE — source of truth для витрины. */
export function getCanonicalGptStorefrontPlans(): ExtendedPlan[] {
  return [...CHATGPT_PLANS.plus, ...CHATGPT_PLANS.pro, ...CHATGPT_PLANS.go].filter(
    (plan) => plan.inStock !== false && !GPT_PUBLIC_HIDDEN_PLAN_IDS.has(plan.id),
  );
}

/**
 * Накладывает API/статические цены на canonical-каталог.
 * Новые тарифы (GO и т.д.) видны сразу, даже если SSR/БД ещё без них.
 */
export function mergeGptStorefrontPlans(overlays?: ExtendedPlan[] | null, now = new Date()): ExtendedPlan[] {
  const byId = new Map<string, ExtendedPlan>();

  for (const plan of getCanonicalGptStorefrontPlans()) {
    byId.set(plan.id, { ...plan });
  }

  for (const plan of overlays ?? []) {
    if (!plan?.id) continue;
    if (plan.inStock === false || GPT_PUBLIC_HIDDEN_PLAN_IDS.has(plan.id)) {
      byId.delete(plan.id);
      continue;
    }
    const base = byId.get(plan.id);
    byId.set(plan.id, base ? { ...base, ...plan } : plan);
  }

  return applyHeroPromoDisplayToGptPlans([...byId.values()], now);
}
