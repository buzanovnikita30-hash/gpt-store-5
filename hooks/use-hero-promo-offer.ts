"use client";

import { useEffect, useMemo, useState } from "react";

import { HERO_PROMO_CONFIG, type HeroPromoSiteKey } from "@/lib/landing/hero-promo-config";
import { getDaysUntilPromoDeadline, isPromoWindowActive } from "@/lib/landing/promo-deadline";
import {
  resolveGptHeroPromoOffer,
  resolveSpotifyHeroPromoOffer,
  type HeroPromoOffer,
} from "@/lib/landing/resolve-hero-promo-offer";
import { PLUS_PLANS_NEW } from "@/lib/chatgpt-data";
import { SPOTIFY_PLANS } from "@/lib/content/spotify";
import type { LandingDiscount } from "@/lib/pricing-helpers";

type GptPlanRow = {
  id?: string;
  name?: string;
  price?: number;
  currency?: string;
  period?: string;
  productId?: string;
  original_price?: number;
  landing_discount_name?: string | null;
};

type SpotifyPlanRow = {
  id?: string;
  name?: string;
  price?: number;
  oldPrice?: number;
  originalPrice?: number;
  landingDiscountName?: string | null;
  durationMonths?: number;
  ctaText?: string;
};

export type HeroPromoState = {
  offer: HeroPromoOffer | null;
  daysLeft: number;
  deadlineLabel: string;
  promoTitle: string;
  promoActive: boolean;
  loading: boolean;
};

export function useHeroPromoOffer(site: HeroPromoSiteKey): HeroPromoState {
  const config = HERO_PROMO_CONFIG[site];
  const [daysLeft, setDaysLeft] = useState(() =>
    getDaysUntilPromoDeadline(config.deadline),
  );
  const [promoActive, setPromoActive] = useState(() => isPromoWindowActive(config.window));
  const [gptPlans, setGptPlans] = useState<GptPlanRow[]>(() =>
    PLUS_PLANS_NEW.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      period: p.period,
      productId: p.productId,
    })),
  );
  const [spotifyPlans, setSpotifyPlans] = useState<SpotifyPlanRow[]>(() =>
    SPOTIFY_PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      originalPrice: p.originalPrice,
      durationMonths: p.durationMonths,
      ctaText: p.ctaText,
    })),
  );
  const [discounts, setDiscounts] = useState<LandingDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tick = () => {
      setDaysLeft(getDaysUntilPromoDeadline(config.deadline));
      setPromoActive(isPromoWindowActive(config.window));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [config.deadline, config.window]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = site === "gpt" ? "/api/public/store-config" : "/api/public/subs-store-config";
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          plans?: GptPlanRow[] | SpotifyPlanRow[];
          landingDiscounts?: LandingDiscount[];
        };
        if (cancelled) return;
        if (site === "gpt") {
          const fromApi = (json.plans as GptPlanRow[]) ?? [];
          // Featured plan must stay available even if admin hide/filter drops it from store-config.
          const byId = new Map<string, GptPlanRow>();
          for (const p of PLUS_PLANS_NEW) {
            if (p.inStock === false) continue;
            byId.set(p.id, {
              id: p.id,
              name: p.name,
              price: p.price,
              currency: p.currency,
              period: p.period,
              productId: p.productId,
            });
          }
          for (const p of fromApi) {
            if (p.id) byId.set(p.id, { ...byId.get(p.id), ...p });
          }
          setGptPlans([...byId.values()]);
        } else {
          setSpotifyPlans((json.plans as SpotifyPlanRow[]) ?? []);
        }
        setDiscounts(json.landingDiscounts ?? []);
      } catch {
        /* fallback to static prices in resolver */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [site]);

  const offer = useMemo(() => {
    if (!config.enabled) return null;

    if (site === "gpt") {
      const plans = gptPlans.filter((p): p is Required<Pick<GptPlanRow, "id" | "name" | "price">> & GptPlanRow =>
        Boolean(p.id && p.name && typeof p.price === "number"),
      );
      return resolveGptHeroPromoOffer(plans, discounts, config);
    }

    const plans = spotifyPlans.filter(
      (p): p is Required<Pick<SpotifyPlanRow, "id" | "name" | "price">> & SpotifyPlanRow =>
        Boolean(p.id && p.name && typeof p.price === "number"),
    );
    return resolveSpotifyHeroPromoOffer(plans, discounts, config);
  }, [config, discounts, gptPlans, site, spotifyPlans]);

  return {
    offer,
    daysLeft,
    deadlineLabel: "31 августа",
    promoTitle: config.promoTitle,
    promoActive: Boolean(offer?.promoActive ?? promoActive),
    loading,
  };
}
