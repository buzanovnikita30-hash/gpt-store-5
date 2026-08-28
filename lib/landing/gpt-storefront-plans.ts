import {
  CHATGPT_PLANS,
  GPT_PUBLIC_HIDDEN_PLAN_IDS,
  formatGptPlanCta,
  type ExtendedPlan,
} from "@/lib/chatgpt-data";
import { applyHeroPromoDisplayToGptPlans } from "@/lib/landing/hero-promo-landing-discount";

const GPT_GO_PLAN_ID = "go-1m";

function lockGptGoStorefrontPrice(plans: ExtendedPlan[]): ExtendedPlan[] {
  const go = CHATGPT_PLANS.go.find((plan) => plan.id === GPT_GO_PLAN_ID);
  if (!go) return plans;
  return plans.map((plan) => {
    if (plan.id !== GPT_GO_PLAN_ID) return plan;
    return {
      ...plan,
      price: go.price,
      cta: formatGptPlanCta(go.price, plan.currency ?? go.currency),
      original_price: undefined,
      landing_discount_name: null,
    } as ExtendedPlan;
  });
}

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

  return lockGptGoStorefrontPrice(applyHeroPromoDisplayToGptPlans([...byId.values()], now));
}
