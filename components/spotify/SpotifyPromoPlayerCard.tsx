"use client";

import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Percent,
  PiggyBank,
} from "lucide-react";
import { SPOTIFY_ACCENT } from "@/lib/content/spotify";
import { ConnectCheckoutButton } from "@/components/checkout/ConnectCheckoutButton";
import { HeroPromoTermsPopover } from "@/components/landing/HeroPromoTermsPopover";
import { cn } from "@/lib/utils";

export type SpotifyHeroPromoUi = {
  originalPrice: number;
  discountLabel: string;
  savingsRub: number;
  periodBadge: string;
  offerHeadline: string;
  monthlyHint: string | null;
  promoBanner: string;
  countdown: string;
  terms: string[];
};

export type SpotifyPromoPlayerCardProps = {
  badge: string;
  title: string;
  subtitle: string;
  fromLabel: string;
  priceRub: number;
  featureChips: string[];
  ctaLabel?: string;
  planId: string | null;
  planName?: string | null;
  tierLabel?: string;
  variant?: "glass" | "solid";
  size?: "default" | "large" | "wide";
  className?: string;
  /** August campaign chrome — when set, shows strikethrough + badges + countdown */
  promo?: SpotifyHeroPromoUi | null;
};

export function SpotifyPromoPlayerCard({
  badge,
  title,
  subtitle,
  fromLabel,
  priceRub,
  featureChips,
  ctaLabel,
  planId,
  planName,
  tierLabel = "Premium",
  variant = "solid",
  size = "default",
  className,
  promo = null,
}: SpotifyPromoPlayerCardProps) {
  const wide = size === "wide";
  const spacious = size === "large" || wide;
  const reduceMotion = useReducedMotion();
  const hasPromo = Boolean(promo && promo.originalPrice > priceRub);

  const shellStyle =
    variant === "glass"
      ? {
          background:
            "linear-gradient(155deg, rgba(22,28,23,0.94) 0%, rgba(10,12,11,0.97) 55%, rgba(14,18,15,0.95) 100%)",
          border: hasPromo ? "1px solid rgba(29,185,84,0.4)" : "1px solid rgba(29,185,84,0.24)",
          backdropFilter: "blur(20px)",
          boxShadow: hasPromo
            ? "0 24px 64px rgba(0,0,0,0.45), 0 0 48px rgba(29,185,84,0.16)"
            : "0 24px 64px rgba(0,0,0,0.45), 0 0 40px rgba(29,185,84,0.1)",
        }
      : {
          background: "linear-gradient(160deg, #141914 0%, #0a0c0a 55%, #121512 100%)",
          border: "1px solid rgba(29,185,84,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 36px rgba(29,185,84,0.1)",
        };

  const banner = (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        !reduceMotion && hasPromo && "shimmer-btn relative overflow-hidden",
      )}
      style={{
        background: "rgba(29,185,84,0.16)",
        color: SPOTIFY_ACCENT,
        border: "1px solid rgba(29,185,84,0.35)",
      }}
    >
      <Flame className="relative z-[2] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="relative z-[2] truncate">
        {hasPromo && promo ? promo.promoBanner : badge || "SPOTIFY STORE"}
      </span>
    </span>
  );

  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden",
        wide
          ? "max-w-none rounded-3xl p-5 sm:p-6 md:p-7"
          : spacious
            ? "max-w-md rounded-3xl p-5 sm:max-w-lg sm:p-6"
            : "max-w-full rounded-2xl p-4 sm:p-5",
        className,
      )}
      style={shellStyle}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 70% at 15% -10%, rgba(29,185,84,0.16) 0%, transparent 55%)",
        }}
      />

      <div className="relative flex flex-col gap-3">
        {hasPromo && promo?.terms?.length ? (
          <HeroPromoTermsPopover terms={promo.terms} accent={SPOTIFY_ACCENT} isDark>
            {banner}
          </HeroPromoTermsPopover>
        ) : (
          <div>{banner}</div>
        )}

        <div>
          {!hasPromo ? (
            <p
              className="font-heading text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: SPOTIFY_ACCENT }}
            >
              {badge || "SPOTIFY STORE"}
            </p>
          ) : null}
          <h3
            className={cn(
              "font-heading font-bold text-white",
              spacious ? "text-2xl sm:text-[1.65rem]" : "text-xl",
              !hasPromo && "mt-1.5",
            )}
          >
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {subtitle}
          </p>
          {hasPromo && promo?.offerHeadline ? (
            <p className="mt-1.5 text-sm font-medium" style={{ color: SPOTIFY_ACCENT }}>
              {promo.offerHeadline}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3" aria-label="Цена">
          <div>
            {hasPromo && promo ? (
              <p
                className="font-heading text-base font-semibold line-through"
                style={{ color: "rgba(255,255,255,0.4)" }}
                aria-label={`Было ${promo.originalPrice.toLocaleString("ru")} рублей`}
              >
                {promo.originalPrice.toLocaleString("ru")} ₽
              </p>
            ) : fromLabel ? (
              <p
                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {fromLabel}
              </p>
            ) : null}
            <p
              className={cn(
                "font-heading font-bold leading-none text-white",
                spacious ? "text-4xl" : "text-3xl",
                hasPromo && "mt-0.5",
              )}
              aria-label={`Сейчас ${priceRub.toLocaleString("ru")} рублей`}
            >
              {priceRub.toLocaleString("ru")}
              <span
                className={cn("ml-1 font-semibold", spacious ? "text-2xl" : "text-xl")}
                style={{ color: SPOTIFY_ACCENT }}
              >
                ₽
              </span>
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "rgba(29,185,84,0.12)",
              border: "1px solid rgba(29,185,84,0.28)",
              color: SPOTIFY_ACCENT,
            }}
          >
            {tierLabel}
          </span>
        </div>

        {hasPromo && promo ? (
          <div className="flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(29,185,84,0.14)", color: SPOTIFY_ACCENT }}
            >
              <Percent className="h-3 w-3" aria-hidden />
              {promo.discountLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              <PiggyBank className="h-3 w-3" aria-hidden />
              Экономия {promo.savingsRub.toLocaleString("ru")} ₽
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              <CalendarDays className="h-3 w-3" aria-hidden />
              До 31 августа
            </span>
          </div>
        ) : null}

        {hasPromo && promo?.monthlyHint ? (
          <p className="text-sm font-medium text-white/75">{promo.monthlyHint}</p>
        ) : null}

        {hasPromo && promo?.countdown ? (
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-black/30 px-3 py-2 text-sm font-medium text-white/80">
            <Clock3 className="h-4 w-4 shrink-0" style={{ color: SPOTIFY_ACCENT }} aria-hidden />
            <span>
              {promo.periodBadge ? `${promo.periodBadge} · ` : null}
              {promo.countdown}
            </span>
          </div>
        ) : null}

        <ul className="flex flex-wrap gap-2">
          {featureChips.slice(0, hasPromo ? 3 : featureChips.length).map((f) => (
            <li
              key={f}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.78)",
              }}
            >
              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: SPOTIFY_ACCENT }} aria-hidden />
              {f}
            </li>
          ))}
        </ul>

        {ctaLabel && planId ? (
          <ConnectCheckoutButton
            siteSlug="subs-store"
            planId={planId}
            planName={planName}
            trackSource="hero_promo_card"
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:text-base"
            style={{ background: SPOTIFY_ACCENT, boxShadow: "0 8px 28px rgba(29,185,84,0.35)" }}
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </ConnectCheckoutButton>
        ) : ctaLabel ? (
          <a
            href="#pricing"
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: SPOTIFY_ACCENT, boxShadow: "0 8px 28px rgba(29,185,84,0.35)" }}
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </a>
        ) : null}
      </div>
    </div>
  );
}
