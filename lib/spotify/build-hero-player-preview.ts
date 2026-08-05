import type { SpotifyPlan } from "@/lib/content/spotify";
import type { SpotifyHeroPlayerPreview } from "@/lib/landing/spotify-landing-types";
import { inferDurationMonths } from "@/lib/spotify-plan-helpers";

function monthsLabel(months: number): string {
  if (months === 1) return "1 месяц";
  if (months >= 2 && months <= 4) return `${months} месяца`;
  return `${months} месяцев`;
}

function cardTitleForPlan(plan: SpotifyPlan): string {
  if (plan.tab === "duo") return "Premium для двоих";
  if (plan.tab === "family") return "Family";
  if (plan.id.includes("new-account")) return "Новый аккаунт";
  const beforeDot = plan.name.split("·")[0]?.trim();
  if (beforeDot && beforeDot.length > 2 && !/^\d+\s*месяц/i.test(beforeDot)) {
    return beforeDot;
  }
  return "Spotify Premium";
}

function cardSubtitleForPlan(plan: SpotifyPlan): string {
  const months = inferDurationMonths(plan);
  if (months) return monthsLabel(months);
  if (plan.id.includes("new-account")) return "Разовое подключение";
  return "Активация 10–15 минут";
}

/** Hero player card fields from the featured checkout plan (not min-price / hardcode). */
export function buildSpotifyHeroPlayerPreview(plan: SpotifyPlan): SpotifyHeroPlayerPreview {
  const chips = (plan.features ?? [])
    .map((f) => String(f).trim())
    .filter((f) => f.length > 0 && f !== "—")
    .slice(0, 3);

  return {
    cardBadge: "SPOTIFY STORE",
    cardTitle: cardTitleForPlan(plan),
    cardSubtitle: cardSubtitleForPlan(plan),
    // Exact featured tariff price — not «от min(individual)».
    fromLabel: "",
    priceRub: plan.price,
    featureChips: chips.length
      ? chips
      : plan.tab === "duo"
        ? ["2 профиля", "Без рекламы", "Поддержка"]
        : ["Без рекламы", "Офлайн", "Поддержка"],
  };
}
