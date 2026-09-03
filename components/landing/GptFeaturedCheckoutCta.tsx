"use client";

import { ArrowRight } from "lucide-react";
import { ConnectCheckoutButton } from "@/components/checkout/ConnectCheckoutButton";
import { parsePlanIdFromCheckoutPath } from "@/lib/checkout/checkout-intent";
import { reachLandingGoal } from "@/lib/analytics/reach-landing-goal";
import type { HeroPromoOffer } from "@/lib/landing/resolve-hero-promo-offer";
import { cn } from "@/lib/utils";

type GptFeaturedCheckoutCtaProps = {
  offer: HeroPromoOffer | null;
  loading?: boolean;
  trackSource: string;
  className?: string;
  fullWidth?: boolean;
};

export function GptFeaturedCheckoutCta({
  offer,
  loading,
  trackSource,
  className,
  fullWidth = true,
}: GptFeaturedCheckoutCtaProps) {
  const planId = offer ? parsePlanIdFromCheckoutPath(offer.checkoutHref) : null;
  const label = offer?.ctaLabelWide || offer?.ctaLabel || "Подключить ChatGPT Plus";

  const classNames = cn(
    "shimmer-btn relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10a37f] sm:px-8 sm:text-base",
    fullWidth ? "w-full md:w-auto" : "w-full",
    className,
  );
  const style = {
    background: "#10a37f",
    boxShadow: "0 4px 16px rgba(16,163,127,0.30)",
  } as const;

  if (loading && !offer) {
    return (
      <span className={cn(classNames, "animate-pulse bg-gray-200 text-transparent")} aria-hidden>
        Подключить ChatGPT Plus
      </span>
    );
  }

  const inner = (
    <span className="relative z-[2] inline-flex items-center justify-center gap-2">
      {label}
      <ArrowRight size={17} aria-hidden />
    </span>
  );

  const onTrackLanding = () => {
    if (trackSource === "landing_hero") {
      reachLandingGoal("landing_hero_cta_click", { site: "gpt-store", source: trackSource });
    }
  };

  if (planId && offer) {
    return (
      <ConnectCheckoutButton
        siteSlug="gpt-store"
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
        reachLandingGoal("landing_scroll_to_pricing", { site: "gpt-store", source: trackSource });
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {inner}
    </a>
  );
}
