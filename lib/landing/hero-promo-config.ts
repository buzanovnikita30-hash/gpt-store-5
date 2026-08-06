import type { PromoDeadline, PromoWindow } from "@/lib/landing/promo-deadline";
import { formatPromoPeriodRange } from "@/lib/landing/promo-deadline";

export type HeroPromoSiteKey = "gpt" | "spotify";

export type HeroPromoSiteConfig = {
  enabled: boolean;
  /** ID тарифа на витрине (plus-ready, spotify-duo-3m, …) */
  featuredPlanId: string;
  /** Цена по акции — оплата и checkout (итоговая) */
  promoSalePrice: number;
  /** Зачёркнутая цена «без скидки» (только визуал) */
  promoOriginalPrice: number;
  /** Бейдж скидки, напр. «Скидка 10%» */
  discountLabel: string;
  fallbackDiscountPercent: number;
  /** Экономия в ₽ (promoOriginal − promoSale) */
  savingsRub: number;
  /** Календарное окно акции (Europe/Moscow) */
  window: PromoWindow;
  /** Alias end date — совместимость со старыми хелперами */
  deadline: PromoDeadline;
  /** Текст на акционной плашке */
  promoTitle: string;
  /** Короткий период, напр. «1–31 августа» */
  periodBadge: string;
  /** Продуктовый оффер под названием */
  offerHeadline: string;
  /** Вторая строка оффера (опционально) */
  offerSubline: string | null;
  /** Подсказка выгоды (Spotify ≈₽/мес) */
  monthlyHint: string | null;
  /** Пункты popover с условиями */
  terms: string[];
};

const AUGUST_2026: PromoWindow = {
  start: { year: 2026, month: 8, day: 1 },
  end: { year: 2026, month: 8, day: 31 },
};

/**
 * Августовская акция 1–31.08.2026 (МСК).
 * Итоговые цены = promoSalePrice (без повторного −10% в checkout).
 */
export const HERO_PROMO_CONFIG: Record<HeroPromoSiteKey, HeroPromoSiteConfig> = {
  gpt: {
    /**
     * Temporary: plus-ready hidden — hero features «Быстрая активация».
     * August ready-account promo stays off until plus-ready returns.
     */
    enabled: false,
    featuredPlanId: "plus-fast",
    promoSalePrice: 2690,
    promoOriginalPrice: 2690,
    discountLabel: "Скидка 10%",
    fallbackDiscountPercent: 10,
    savingsRub: 0,
    window: AUGUST_2026,
    deadline: AUGUST_2026.end,
    promoTitle: "Скидка 10% · до 31 августа",
    periodBadge: "1–31 августа",
    offerHeadline: "Подключение вне очереди — обычно 5–15 минут",
    offerSubline: null,
    monthlyHint: null,
    terms: [
      "Акция действует с 1 по 31 августа 2026 года (по московскому времени).",
      "Указанная на карточке цена уже итоговая — дополнительные 10% автоматически не вычитаются.",
      "Акция относится только к тарифу «Быстрая активация».",
      "Совместимость с промокодами определяется правилами сайта на момент оформления.",
    ],
  },
  spotify: {
    enabled: true,
    featuredPlanId: "spotify-duo-3m",
    promoSalePrice: 1690,
    promoOriginalPrice: 1890,
    discountLabel: "Скидка 10%",
    fallbackDiscountPercent: 10,
    savingsRub: 200,
    window: AUGUST_2026,
    deadline: AUGUST_2026.end,
    promoTitle: "Скидка 10% · до 31 августа",
    periodBadge: "1–31 августа",
    offerHeadline: "Spotify Premium выгоднее для двоих",
    offerSubline: null,
    monthlyHint: "≈563 ₽ в месяц за двоих",
    terms: [
      "Акция действует с 1 по 31 августа 2026 года (по московскому времени).",
      "Указанная на карточке цена уже итоговая — дополнительные 10% автоматически не вычитаются.",
      "Акция относится только к тарифу «Premium для двоих · 3 месяца».",
      "Совместимость с промокодами определяется правилами сайта на момент оформления.",
    ],
  },
};

export function heroPromoFixedDisplay(config: HeroPromoSiteConfig): {
  original: number;
  sale: number;
  label: string;
  savingsRub: number;
  percent: number;
} | null {
  const {
    promoOriginalPrice: original,
    promoSalePrice: sale,
    discountLabel,
    fallbackDiscountPercent,
    savingsRub,
  } = config;
  if (original <= sale || sale <= 0) return null;
  const computedSavings = original - sale;
  return {
    original,
    sale,
    label: discountLabel || `Скидка ${fallbackDiscountPercent}%`,
    savingsRub: savingsRub > 0 ? savingsRub : computedSavings,
    percent: fallbackDiscountPercent,
  };
}

export function heroPromoPeriodLabel(config: HeroPromoSiteConfig): string {
  return config.periodBadge || formatPromoPeriodRange(config.window);
}
