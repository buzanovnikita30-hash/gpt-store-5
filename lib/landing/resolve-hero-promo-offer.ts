import { applyLandingDiscount, pickLandingDiscount, type LandingDiscount } from "@/lib/pricing-helpers";
import {
  heroPromoFixedDisplay,
  heroPromoPeriodLabel,
  heroPromoUntilLabel,
  type HeroPromoSiteConfig,
} from "@/lib/landing/hero-promo-config";
import { isPromoWindowActive } from "@/lib/landing/promo-deadline";

function activeFixedPromo(config: HeroPromoSiteConfig, now = new Date()) {
  if (!config.enabled) return null;
  if (!isPromoWindowActive(config.window, now)) return null;
  return heroPromoFixedDisplay(config);
}

export type HeroPromoOffer = {
  planId: string;
  planName: string;
  periodLabel: string;
  originalPrice: number;
  salePrice: number;
  discountLabel: string | null;
  discountPercent: number;
  savingsRub: number;
  checkoutHref: string;
  ctaLabel: string;
  /** Акция активна (окно дат) — показывать strikethrough/бейджи/countdown */
  promoActive: boolean;
  offerHeadline: string | null;
  offerSubline: string | null;
  monthlyHint: string | null;
  periodBadge: string | null;
  /** «До 31 сентября» — маркетинговая дата с карточки, не calendar overflow */
  untilLabel: string | null;
  promoBanner: string | null;
  terms: string[];
};

type GptPlanLike = {
  id: string;
  name: string;
  price: number;
  currency?: string;
  period?: string;
  original_price?: number;
  landing_discount_name?: string | null;
  productId?: string;
};

type SpotifyPlanLike = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  landingDiscountName?: string | null;
  durationMonths?: number;
  ctaText?: string;
};

function hasRealAdminLandingDiscount(
  basePrice: number,
  planId: string,
  productId: string | undefined,
  discounts: LandingDiscount[],
): boolean {
  const landing = pickLandingDiscount(planId, productId, discounts);
  if (!landing) return false;
  const { cut, displayPrice } = applyLandingDiscount(basePrice, landing);
  return cut > 0 && displayPrice < basePrice;
}

function resolvePrices(
  basePrice: number,
  planId: string,
  productId: string | undefined,
  discounts: LandingDiscount[],
  explicitOriginal: number | undefined,
  explicitDiscountName: string | null | undefined,
  config: HeroPromoSiteConfig,
  now: Date,
): { original: number; sale: number; label: string | null; promoActive: boolean; savingsRub: number } {
  // Fixed hero campaign wins for featured plan while window is open.
  const fixed = activeFixedPromo(config, now);
  if (fixed && planId === config.featuredPlanId) {
    return {
      original: fixed.original,
      sale: fixed.sale,
      label: fixed.label,
      promoActive: true,
      savingsRub: fixed.savingsRub,
    };
  }

  const landing = pickLandingDiscount(planId, productId, discounts);
  if (landing) {
    const { displayPrice, cut, name } = applyLandingDiscount(basePrice, landing);
    if (cut > 0 && displayPrice < basePrice) {
      return {
        original: basePrice,
        sale: displayPrice,
        label: name ?? explicitDiscountName ?? null,
        promoActive: true,
        savingsRub: basePrice - displayPrice,
      };
    }
  }

  if (explicitOriginal != null && explicitOriginal > basePrice) {
    return {
      original: explicitOriginal,
      sale: basePrice,
      label: explicitDiscountName ?? null,
      promoActive: true,
      savingsRub: explicitOriginal - basePrice,
    };
  }

  return { original: basePrice, sale: basePrice, label: null, promoActive: false, savingsRub: 0 };
}

function buildOfferBase(
  config: HeroPromoSiteConfig,
  promoActive: boolean,
): Pick<
  HeroPromoOffer,
  "offerHeadline" | "offerSubline" | "monthlyHint" | "periodBadge" | "untilLabel" | "promoBanner" | "terms"
> {
  if (!promoActive) {
    return {
      offerHeadline: null,
      offerSubline: null,
      monthlyHint: null,
      periodBadge: null,
      untilLabel: null,
      promoBanner: null,
      terms: [],
    };
  }
  return {
    offerHeadline: config.offerHeadline,
    offerSubline: config.offerSubline,
    monthlyHint: config.monthlyHint,
    periodBadge: heroPromoPeriodLabel(config),
    untilLabel: heroPromoUntilLabel(config),
    promoBanner: config.promoTitle,
    terms: config.terms,
  };
}

export function resolveGptHeroPromoOffer(
  plans: GptPlanLike[],
  discounts: LandingDiscount[],
  config: HeroPromoSiteConfig,
  now = new Date(),
): HeroPromoOffer | null {
  const plan = plans.find((p) => p.id === config.featuredPlanId);
  if (!plan) return null;

  const fixed = activeFixedPromo(config, now);
  let original: number;
  let sale: number;
  let label: string | null;
  let promoActive: boolean;
  let savingsRub: number;

  if (fixed) {
    original = fixed.original;
    sale = fixed.sale;
    label = fixed.label;
    promoActive = true;
    savingsRub = fixed.savingsRub;
  } else {
    const preAppliedOriginal = plan.original_price;
    const preAppliedSale = plan.price;
    const hasPreApplied = preAppliedOriginal != null && preAppliedOriginal > preAppliedSale;
    if (hasPreApplied) {
      original = preAppliedOriginal!;
      sale = preAppliedSale;
      label = plan.landing_discount_name ?? null;
      promoActive = false; // outside campaign window — don't show August chrome
      savingsRub = original - sale;
    } else if (hasRealAdminLandingDiscount(plan.price, plan.id, plan.productId, discounts)) {
      const resolved = resolvePrices(
        plan.price,
        plan.id,
        plan.productId,
        discounts,
        preAppliedOriginal,
        plan.landing_discount_name,
        config,
        now,
      );
      original = resolved.original;
      sale = resolved.sale;
      label = resolved.label;
      promoActive = resolved.promoActive;
      savingsRub = resolved.savingsRub;
    } else {
      original = plan.price;
      sale = plan.price;
      label = null;
      promoActive = false;
      savingsRub = 0;
    }
  }

  if (sale <= 0) return null;
  const hasDiscount = sale < original;
  const currency = plan.currency ?? "₽";
  const period = plan.period ?? "мес";

  return {
    planId: plan.id,
    planName: plan.name,
    periodLabel: period,
    originalPrice: hasDiscount ? original : sale,
    salePrice: sale,
    discountLabel: promoActive && hasDiscount ? label : null,
    discountPercent: config.fallbackDiscountPercent,
    savingsRub: promoActive && hasDiscount ? savingsRub : 0,
    checkoutHref: `/checkout?plan=${encodeURIComponent(plan.id)}`,
    ctaLabel: `Подключить за ${sale.toLocaleString("ru")} ${currency}`,
    promoActive: promoActive && hasDiscount,
    ...buildOfferBase(config, promoActive && hasDiscount),
  };
}

export function resolveSpotifyHeroPromoOffer(
  plans: SpotifyPlanLike[],
  discounts: LandingDiscount[],
  config: HeroPromoSiteConfig,
  now = new Date(),
): HeroPromoOffer | null {
  const plan = plans.find((p) => p.id === config.featuredPlanId);
  if (!plan) return null;

  const fixed = activeFixedPromo(config, now);
  let original: number;
  let sale: number;
  let label: string | null;
  let promoActive: boolean;
  let savingsRub: number;

  if (fixed) {
    original = fixed.original;
    sale = fixed.sale;
    label = fixed.label;
    promoActive = true;
    savingsRub = fixed.savingsRub;
  } else {
    const preAppliedOriginal = plan.originalPrice ?? plan.oldPrice;
    const preAppliedSale = plan.price;
    const hasPreApplied = preAppliedOriginal != null && preAppliedOriginal > preAppliedSale;
    if (hasPreApplied) {
      original = preAppliedOriginal!;
      sale = preAppliedSale;
      label = plan.landingDiscountName ?? null;
      promoActive = false;
      savingsRub = original - sale;
    } else if (hasRealAdminLandingDiscount(plan.price, plan.id, undefined, discounts)) {
      const resolved = resolvePrices(
        plan.price,
        plan.id,
        undefined,
        discounts,
        plan.oldPrice,
        plan.landingDiscountName,
        config,
        now,
      );
      original = resolved.original;
      sale = resolved.sale;
      label = resolved.label;
      promoActive = resolved.promoActive;
      savingsRub = resolved.savingsRub;
    } else {
      original = plan.price;
      sale = plan.price;
      label = null;
      promoActive = false;
      savingsRub = 0;
    }
  }

  if (sale <= 0) return null;
  const hasDiscount = sale < original;
  const isNewAccount = plan.id.includes("new-account");
  const periodLabel = isNewAccount
    ? "разовое подключение"
    : plan.durationMonths && plan.durationMonths > 1
      ? `${plan.durationMonths} месяца`
      : "мес";

  const planName = isNewAccount
    ? "Новый аккаунт"
    : plan.id === "spotify-duo-3m" || (plan.name.includes("двоих") && /3/.test(plan.name))
      ? "Premium для двоих"
      : plan.name;

  return {
    planId: plan.id,
    planName,
    periodLabel: isNewAccount ? periodLabel : plan.durationMonths === 3 ? "3 месяца" : periodLabel,
    originalPrice: hasDiscount ? original : sale,
    salePrice: sale,
    discountLabel: promoActive && hasDiscount ? label : null,
    discountPercent: config.fallbackDiscountPercent,
    savingsRub: promoActive && hasDiscount ? savingsRub : 0,
    checkoutHref: `/checkout/spotify?plan=${encodeURIComponent(plan.id)}`,
    ctaLabel: plan.ctaText?.trim() || `Подключить за ${sale.toLocaleString("ru")} ₽`,
    promoActive: promoActive && hasDiscount,
    ...buildOfferBase(config, promoActive && hasDiscount),
  };
}
