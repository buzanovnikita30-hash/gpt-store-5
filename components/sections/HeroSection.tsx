"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
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

function scrollToHowItWorks(): void {
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroPriceBlock() {
  const { offer, loading } = useHeroPromoOffer("gpt");
  const promo = Boolean(offer?.promoActive);

  if (loading && !offer) {
    return <div className="mt-5 h-16 w-48 animate-pulse rounded-xl bg-gray-100" aria-hidden />;
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
            <span className="mb-1.5 inline-flex rounded-full bg-[#10a37f]/10 px-2.5 py-1 text-xs font-semibold text-[#0f7d62]">
              {discountChip}
            </span>
          </HeroPromoTermsPopover>
        ) : (
          <span className="mb-1.5 inline-flex rounded-full bg-[#10a37f]/10 px-2.5 py-1 text-xs font-semibold text-[#0f7d62]">
            {discountChip}
          </span>
        )
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {promo ? (
          <span className="font-heading text-base font-semibold text-gray-400 line-through">
            {offer.originalPrice.toLocaleString("ru")} ₽
          </span>
        ) : null}
        <p className="font-heading text-3xl font-bold leading-none text-gray-900 md:text-[2rem]">
          {offer.salePrice.toLocaleString("ru")} ₽
          <span className="ml-1 text-base font-semibold text-gray-500">/ месяц</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {price}
      <div className="mt-5 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <GptFeaturedCheckoutCta offer={offer} loading={loading} trackSource="landing_hero" />
        <a
          href="#how-it-works"
          onClick={(e) => {
            e.preventDefault();
            scrollToHowItWorks();
          }}
          className="inline-flex min-h-12 items-center justify-center text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          {HERO_CONTENT.secondaryCta} →
        </a>
      </div>
      <p className="mt-3 hidden text-xs text-gray-400 md:block md:text-sm">{HERO_CONTENT.meta}</p>
    </>
  );
}

export function HeroSection() {
  const heroAb = useLandingHeroAb("gpt-store");
  const reduceMotion = useReducedMotion();
  const badge = heroAb === "h1" ? HERO_BADGE_NO_TIMING : HERO_BADGE_WITH_TIMING;
  const accentTitle = heroAb === "h1" ? HERO_ACCENT_WITH_TIMING : HERO_ACCENT_BASE;
  return (
    <section id="hero" className="relative overflow-hidden px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-6">
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

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-left"
        >
          <div className="mb-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border border-[#10a37f]/20 bg-[#10a37f]/[0.07] px-3 py-1.5 text-[11px] leading-snug text-[#10a37f] min-[375px]:text-xs md:mb-4">
            <span className="h-2 w-2 rounded-full bg-[#10a37f]" />
            {badge}
          </div>

          <h1 className="font-heading font-bold leading-[1.12] tracking-tight text-gray-900">
            <span className="block text-[1.65rem] min-[375px]:text-[1.85rem] md:text-4xl lg:text-[2.75rem]">
              {HERO_CONTENT.title}
            </span>
            <span
              className="mt-1 block text-[1.45rem] font-bold min-[375px]:text-[1.7rem] md:text-4xl lg:text-[2.75rem]"
              style={{
                background: "linear-gradient(135deg, #10a37f 0%, #1a56db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {accentTitle}
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 md:mt-4 md:text-base">
            {HERO_CONTENT.subtitle}
          </p>

          <ul className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 md:flex">
            {HERO_CONTENT.trustBadges.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                {item === "Рейтинг 4.9/5" ? (
                  <>
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                    <a href="#reviews" className="hover:text-gray-900">
                      {item}
                    </a>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#10a37f]" aria-hidden />
                    {item}
                  </>
                )}
              </li>
            ))}
          </ul>

          <HeroPriceBlock />

          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 md:hidden">
            {HERO_CONTENT.trustBadges.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#10a37f]" aria-hidden />
                {item === "Рейтинг 4.9/5" ? (
                  <a href="#reviews" className="hover:text-gray-900">
                    {item}
                  </a>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 md:hidden">
            <GptHeroResultCard />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:block"
        >
          <GptHeroResultCard />
        </motion.div>
      </div>
    </section>
  );
}
