"use client";

import { ArrowRight } from "lucide-react";
import { ConnectCheckoutButton } from "@/components/checkout/ConnectCheckoutButton";
import { parsePlanIdFromCheckoutPath } from "@/lib/checkout/checkout-intent";
import { reachLandingGoal } from "@/lib/analytics/reach-landing-goal";
import { scrollToSpotifyPricing } from "@/lib/spotify/scroll-to-pricing";
import { SPOTIFY_ACCENT } from "@/lib/content/spotify";
import type { HeroPromoOffer } from "@/lib/landing/resolve-hero-promo-offer";
import { cn } from "@/lib/utils";

type SpotifyFeaturedCheckoutCtaProps = {
  offer: HeroPromoOffer | null;
  loading?: boolean;
  trackSource: string;
  className?: string;
  fullWidth?: boolean;
  size?: "default" | "lg";
};

export function SpotifyFeaturedCheckoutCta({
  offer,
  loading,
  trackSource,
  className,
  fullWidth = true,
  size = "default",
}: SpotifyFeaturedCheckoutCtaProps) {
  const planId = offer ? parsePlanIdFromCheckoutPath(offer.checkoutHref) : null;
  const label = offer?.ctaLabelWide || offer?.ctaLabel || "Подключить Spotify Premium";
  const large = size === "lg";

  const classNames = cn(
    "shimmer-btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]",
    large
      ? "min-h-14 rounded-2xl px-7 py-3.5 text-base sm:min-h-16 sm:px-10 sm:text-lg"
      : "min-h-12 px-6 py-3.5 text-sm sm:px-8 sm:text-base",
    fullWidth ? "w-full md:w-auto" : "w-full",
    className,
  );
  const style = {
    background: SPOTIFY_ACCENT,
    boxShadow: "0 4px 20px rgba(29,185,84,0.35)",
  } as const;

  if (loading && !offer) {
    return (
      <span className={cn(classNames, "animate-pulse bg-white/10 text-transparent")} aria-hidden>
        Подключить Spotify Premium
      </span>
    );
  }

  const inner = (
    <span className="relative z-[2] inline-flex items-center justify-center gap-2">
      {label}
      <ArrowRight size={large ? 22 : 17} aria-hidden />
    </span>
  );

  const onTrackLanding = () => {
    if (trackSource === "landing_hero") {
      reachLandingGoal("landing_hero_cta_click", { site: "subs-store", source: trackSource });
    }
  };

  if (planId && offer) {
    return (
      <ConnectCheckoutButton
        siteSlug="subs-store"
        planId={planId}
        planName={offer.planName}
        trackSource={trackSource}
        className={classNames}
        style={style}
        onClick={onTrackLanding}
      >
        {inner}
      </ConnectCheckoutButton>
    );
  }

  return (
    <a
      href="#pricing"
      className={classNames}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        onTrackLanding();
        reachLandingGoal("landing_scroll_to_pricing", { site: "subs-store", source: trackSource });
        scrollToSpotifyPricing();
      }}
    >
      {inner}
    </a>
  );
}
