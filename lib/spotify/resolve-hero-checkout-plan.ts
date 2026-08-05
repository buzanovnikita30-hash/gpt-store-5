import type { SpotifyPlan } from "@/lib/content/spotify";
import { HERO_PROMO_CONFIG } from "@/lib/landing/hero-promo-config";

/**
 * Hero CTA plan for Spotify landing.
 * Source of truth: HERO_PROMO_CONFIG.spotify.featuredPlanId (live tariffs via plans[]).
 * Fallbacks: popular duo → any duo → cheapest active plan with price > 0.
 */
export function resolveHeroCheckoutPlan(plans: readonly SpotifyPlan[]): SpotifyPlan | null {
  const active = plans.filter((p) => p.price > 0);
  if (!active.length) return null;

  const featuredId = HERO_PROMO_CONFIG.spotify.featuredPlanId;
  const featured = active.find((p) => p.id === featuredId);
  if (featured) return featured;

  const popularDuo = active.find((p) => p.tab === "duo" && p.isPopular);
  if (popularDuo) return popularDuo;

  const anyDuo = active
    .filter((p) => p.tab === "duo")
    .sort((a, b) => a.price - b.price);
  if (anyDuo[0]) return anyDuo[0];

  return active.reduce((best, p) => (p.price < best.price ? p : best));
}
