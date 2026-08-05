import type { ExtendedPlan } from "@/lib/chatgpt-data";
import type { SpotifyPlan } from "@/lib/content/spotify";
import { HERO_PROMO_CONFIG, heroPromoFixedDisplay } from "@/lib/landing/hero-promo-config";
import { isPromoWindowActive } from "@/lib/landing/promo-deadline";

type GptPlanWithDisplay = ExtendedPlan & {
  original_price?: number;
  landing_discount_name?: string | null;
};

/**
 * Applies August campaign display prices to the featured plan while the window is open.
 * Sale price becomes `plan.price` (checkout amount). Original is visual only.
 * Does not stack an extra % on top of promoSalePrice.
 */
export function applyHeroPromoDisplayToGptPlans(
  plans: ExtendedPlan[],
  now = new Date(),
): ExtendedPlan[] {
  const config = HERO_PROMO_CONFIG.gpt;
  const fixed = heroPromoFixedDisplay(config);
  if (!config.enabled || !isPromoWindowActive(config.window, now) || !fixed) return plans;

  return plans.map((plan) => {
    if (plan.id !== config.featuredPlanId) return plan;

    const row = plan as GptPlanWithDisplay;
    if (
      row.original_price != null &&
      row.original_price > plan.price &&
      row.landing_discount_name &&
      row.landing_discount_name !== config.discountLabel &&
      row.landing_discount_name !== config.promoTitle &&
      !row.landing_discount_name.startsWith("Скидка")
    ) {
      // Preserve unrelated admin landing discount already on the plan.
      return plan;
    }

    const currency = plan.currency ?? "₽";
    return {
      ...plan,
      price: fixed.sale,
      original_price: fixed.original,
      landing_discount_name: fixed.label,
      cta: `Подключить за ${fixed.sale.toLocaleString("ru")} ${currency}`,
    } as ExtendedPlan;
  });
}

export function applyHeroPromoDisplayToSpotifyPlans(
  plans: SpotifyPlan[],
  now = new Date(),
): SpotifyPlan[] {
  const config = HERO_PROMO_CONFIG.spotify;
  const fixed = heroPromoFixedDisplay(config);
  if (!config.enabled || !isPromoWindowActive(config.window, now) || !fixed) return plans;

  return plans.map((plan) => {
    if (plan.id !== config.featuredPlanId) return plan;

    if (
      plan.originalPrice != null &&
      plan.originalPrice > plan.price &&
      plan.landingDiscountName &&
      plan.landingDiscountName !== config.discountLabel &&
      plan.landingDiscountName !== config.promoTitle &&
      !plan.landingDiscountName.startsWith("Скидка")
    ) {
      return plan;
    }

    return {
      ...plan,
      price: fixed.sale,
      originalPrice: fixed.original,
      oldPrice: fixed.original,
      landingDiscountName: fixed.label,
      ctaText: `Подключить за ${fixed.sale.toLocaleString("ru")} ₽`,
    };
  });
}
