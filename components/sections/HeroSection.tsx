"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, CreditCard, Shield, Star } from "lucide-react";
import {
  HERO_CONTENT,
  HERO_ACCENT_BASE,
  HERO_ACCENT_WITH_TIMING,
  HERO_BADGE_NO_TIMING,
  HERO_BADGE_WITH_TIMING,
} from "@/lib/chatgpt-data";
import { useLandingHeroAb } from "@/lib/analytics/landing-hero-ab";
import { useHeroPromoOffer } from "@/hooks/use-hero-promo-offer";
import { GptFeaturedCheckoutCta } from "@/components/landing/GptFeaturedCheckoutCta";
import { GptHeroResultCard } from "@/components/sections/GptHeroResultCard";
import { HeroPromoTermsPopover } from "@/components/landing/HeroPromoTermsPopover";

const TRUST_ITEMS = [
  { label: "Подключение за 5–15 минут", icon: Clock3 },
  { label: "Оплата в рублях", icon: CreditCard },
  { label: "Гарантия на весь срок", icon: Shield },
  { label: "Рейтинг 4.9/5", icon: Star, href: "#reviews" },
] as const;

function scrollToHowItWorks(): void {
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroPriceBlock() {
  const { offer, loading } = useHeroPromoOffer("gpt");
  const promo = Boolean(offer?.promoActive);

  if (loading && !offer) {
    return <div className="mt-5 h-16 w-52 animate-pulse rounded-xl bg-gray-100" aria-hidden />;
  }

  if (!offer) return null;

  const discountChip =
    promo && offer.savingsRub > 0
      ? `−${offer.savingsRub.toLocaleString("ru")} ₽${offer.untilLabel ? ` ${offer.untilLabel.replace(/^До\s+/i, "до ")}` : ""}`
      : null;

  const price = (
    <div className="mt-5 text-left" aria-label="Цена">
      {discountChip ? (
        offer.terms.length ? (
          <HeroPromoTermsPopover terms={offer.terms} accent="#10a37f" isDark={false}>
            <span className="mb-1.5 inline-flex rounded-full bg-[#d8f3ea] px-3 py-1 text-xs font-semibold text-[#0f7d62]">
              {discountChip}
            </span>
          </HeroPromoTermsPopover>
        ) : (
          <span className="mb-1.5 inline-flex rounded-full bg-[#d8f3ea] px-3 py-1 text-xs font-semibold text-[#0f7d62]">
            {discountChip}
          </span>
        )
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {promo ? (
          <span className="font-heading text-lg font-semibold text-gray-400 line-through md:text-xl">
            {offer.originalPrice.toLocaleString("ru")} ₽
          </span>
        ) : null}
        <p className="font-heading text-[1.85rem] font-bold leading-none text-gray-900 md:text-4xl">
          {offer.salePrice.toLocaleString("ru")} ₽
          <span className="ml-1.5 text-base font-semibold text-gray-500 md:text-lg">/ месяц</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {price}
      <div className="mt-5 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <GptFeaturedCheckoutCta
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
          className="inline-flex min-h-14 items-center justify-center text-sm text-gray-500 transition-colors hover:text-gray-800 md:text-base"
        >
          {HERO_CONTENT.secondaryCta} →
        </a>
      </div>
      <p className="mt-3 hidden text-xs text-gray-400 md:block md:text-sm">{HERO_CONTENT.meta}</p>
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
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10a37f]/12 md:h-11 md:w-11">
              <Icon
                className={`h-5 w-5 md:h-6 md:w-6 ${isStar ? "fill-amber-400 text-amber-400" : "text-[#10a37f]"}`}
                aria-hidden
              />
            </span>
            <span className="text-xs font-medium text-gray-700 md:text-sm">{item.label}</span>
          </>
        );
        return (
          <li key={item.label}>
            {"href" in item && item.href ? (
              <a href={item.href} className="flex items-center gap-3 hover:text-gray-900">
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

export function HeroSection() {
  const heroAb = useLandingHeroAb("gpt-store");
  const reduceMotion = useReducedMotion();
  const badge = heroAb === "h1" ? HERO_BADGE_NO_TIMING : HERO_BADGE_WITH_TIMING;
  const accentTitle = heroAb === "h1" ? HERO_ACCENT_WITH_TIMING : HERO_ACCENT_BASE;
  return (
    <section
      id="hero"
      className="relative flex flex-1 flex-col justify-center overflow-x-hidden px-4 py-5 md:px-8 md:py-6 lg:px-11"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 75% 55% at 50% 20%, rgba(16,163,127,0.07) 0%, transparent 68%),
              radial-gradient(ellipse 50% 40% at 85% 90%, rgba(96,124,196,0.06) 0%, transparent 58%)
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
          <div className="mb-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border border-[#10a37f]/20 bg-[#10a37f]/[0.07] px-3 py-1.5 text-[11px] leading-snug text-[#10a37f] md:mb-4 md:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#10a37f]" />
            {badge}
          </div>

          <h1 className="font-heading text-[1.5rem] font-bold leading-[1.08] tracking-tight min-[375px]:text-[1.7rem] md:text-4xl lg:text-5xl xl:text-[3.5rem]">
            <span className="text-gray-900">{HERO_CONTENT.title} </span>
            <span className="text-[#10a37f]">{accentTitle}</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 md:mt-4 md:text-base lg:text-lg">
            {HERO_CONTENT.subtitle}
          </p>

          <div className="hidden md:block">
            <TrustList />
          </div>

          <HeroPriceBlock />

          <div className="md:hidden">
            <TrustList compact />
          </div>

          <div className="mt-6 md:hidden">
            <GptHeroResultCard />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden h-full md:flex md:items-stretch"
        >
          <GptHeroResultCard className="h-full w-full" />
        </motion.div>
      </div>
    </section>
  );
}
