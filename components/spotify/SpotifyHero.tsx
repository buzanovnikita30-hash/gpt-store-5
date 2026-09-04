"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, CreditCard, Shield, Star } from "lucide-react";
import {
  SPOTIFY_ACCENT,
  SPOTIFY_HERO_ACCENT_BASE,
  SPOTIFY_HERO_ACCENT_WITH_TIMING,
  SPOTIFY_HERO_BADGE_NO_TIMING,
  SPOTIFY_HERO_BADGE_WITH_TIMING,
} from "@/lib/content/spotify";
import { useLandingHeroAb } from "@/lib/analytics/landing-hero-ab";
import { useHeroPromoOffer } from "@/hooks/use-hero-promo-offer";
import { useSpotifyLanding } from "@/components/spotify/SpotifyLandingProvider";
import { SpotifyFeaturedCheckoutCta } from "@/components/landing/SpotifyFeaturedCheckoutCta";
import { SpotifyHeroResultCard } from "@/components/spotify/SpotifyHeroResultCard";
import { HeroPromoTermsPopover } from "@/components/landing/HeroPromoTermsPopover";

const TRUST_ITEMS = [
  { label: "Подключение за 10–15 минут", icon: Clock3 },
  { label: "Оплата в рублях", icon: CreditCard },
  { label: "Гарантия на весь срок", icon: Shield },
  { label: "Рейтинг 4.9/5", icon: Star, href: "#reviews" },
] as const;

function scrollToHowItWorks(): void {
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroPriceBlock() {
  const { hero } = useSpotifyLanding();
  const { offer, loading } = useHeroPromoOffer("spotify");
  const promo = Boolean(offer?.promoActive);

  if (loading && !offer) {
    return <div className="mt-5 h-16 w-52 animate-pulse rounded-xl bg-white/8" aria-hidden />;
  }

  if (!offer) return null;

  const discountChip =
    promo && offer.savingsRub > 0
      ? `−${offer.savingsRub.toLocaleString("ru")} ₽${offer.untilLabel ? ` ${offer.untilLabel.replace(/^До\s+/i, "до ")}` : ""}`
      : null;

  const periodSuffix = offer.planId.includes("new-account")
    ? "разово"
    : offer.periodLabel === "мес"
      ? "месяц"
      : offer.periodLabel;

  const price = (
    <div className="mt-5 text-left" aria-label="Цена">
      {discountChip ? (
        offer.terms.length ? (
          <HeroPromoTermsPopover terms={offer.terms} accent={SPOTIFY_ACCENT} isDark>
            <span
              className="mb-1.5 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(29,185,84,0.16)", color: SPOTIFY_ACCENT }}
            >
              {discountChip}
            </span>
          </HeroPromoTermsPopover>
        ) : (
          <span
            className="mb-1.5 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "rgba(29,185,84,0.16)", color: SPOTIFY_ACCENT }}
          >
            {discountChip}
          </span>
        )
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {promo ? (
          <span className="font-heading text-lg font-semibold text-white/40 line-through md:text-xl">
            {offer.originalPrice.toLocaleString("ru")} ₽
          </span>
        ) : null}
        <p className="font-heading text-[1.85rem] font-bold leading-none text-white md:text-4xl">
          {offer.salePrice.toLocaleString("ru")} ₽
          {periodSuffix ? (
            <span className="ml-1.5 text-base font-semibold text-white/50 md:text-lg">
              / {periodSuffix}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {price}
      <div className="mt-5 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <SpotifyFeaturedCheckoutCta
          offer={offer}
          loading={loading}
          trackSource="landing_hero"
          size="lg"
        />
        <a
          href="#how-it-works"
          onClick={(e) => {
            e.preventDefault();
            scrollToHowItWorks();
          }}
          className="inline-flex min-h-14 items-center justify-center text-sm text-white/45 transition-colors hover:text-white/80 md:text-base"
        >
          {hero.secondaryCta} →
        </a>
      </div>
      <p className="mt-3 hidden text-xs text-white/30 md:block md:text-sm">{hero.meta}</p>
    </>
  );
}

function TrustList({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={
        compact
          ? "mt-4 grid grid-cols-1 gap-2.5"
          : "mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      }
    >
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon;
        const isStar = item.label === "Рейтинг 4.9/5";
        const body = (
          <>
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-11 md:w-11"
              style={{ background: "rgba(29,185,84,0.14)" }}
            >
              <Icon
                className={`h-5 w-5 md:h-6 md:w-6 ${isStar ? "fill-amber-400 text-amber-400" : ""}`}
                style={isStar ? undefined : { color: SPOTIFY_ACCENT }}
                aria-hidden
              />
            </span>
            <span className="text-xs font-medium text-white/75 md:text-sm">{item.label}</span>
          </>
        );
        return (
          <li key={item.label}>
            {"href" in item && item.href ? (
              <a href={item.href} className="flex items-center gap-3 hover:text-white">
                {body}
              </a>
            ) : (
              <div className="flex items-center gap-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SpotifyHero() {
  const { hero } = useSpotifyLanding();
  const heroAb = useLandingHeroAb("subs-store");
  const reduceMotion = useReducedMotion();
  const badge = heroAb === "h1" ? SPOTIFY_HERO_BADGE_NO_TIMING : SPOTIFY_HERO_BADGE_WITH_TIMING;
  const accentTitle =
    heroAb === "h1" ? SPOTIFY_HERO_ACCENT_WITH_TIMING : SPOTIFY_HERO_ACCENT_BASE;

  return (
    <section
      id="hero"
      className="relative flex flex-1 flex-col justify-center overflow-x-hidden px-4 py-5 md:px-8 md:py-6 lg:px-11"
      style={{ background: "#0a0a0a" }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 75% 55% at 50% 20%, rgba(29,185,84,0.10) 0%, transparent 68%),
              radial-gradient(ellipse 50% 40% at 85% 90%, rgba(29,185,84,0.06) 0%, transparent 58%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[72rem] grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-8 lg:gap-11">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-left"
        >
          <div
            className="mb-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border px-3 py-1.5 text-[11px] leading-snug md:mb-4 md:text-xs"
            style={{
              borderColor: "rgba(29,185,84,0.28)",
              background: "rgba(29,185,84,0.10)",
              color: SPOTIFY_ACCENT,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: SPOTIFY_ACCENT }} />
            {badge}
          </div>

          <h1 className="font-heading text-[1.5rem] font-bold leading-[1.08] tracking-tight min-[375px]:text-[1.7rem] md:text-4xl lg:text-5xl xl:text-[3.5rem]">
            <span className="text-white">{hero.title} </span>
            <span style={{ color: SPOTIFY_ACCENT }}>{accentTitle}</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 md:mt-4 md:text-base lg:text-lg">
            {hero.subtitle}
          </p>

          <div className="hidden md:block">
            <TrustList />
          </div>

          <HeroPriceBlock />

          <div className="md:hidden">
            <TrustList compact />
          </div>

          <div className="mt-6 md:hidden">
            <SpotifyHeroResultCard />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden h-full md:flex md:items-stretch"
        >
          <SpotifyHeroResultCard className="h-full w-full" />
        </motion.div>
      </div>
    </section>
  );
}
