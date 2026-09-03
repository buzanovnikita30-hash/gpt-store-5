"use client";

import { motion } from "framer-motion";
import { CreditCard, Headphones, ShieldCheck } from "lucide-react";
import { fadeUp } from "@/lib/motion-config";
import { useHeroPromoOffer } from "@/hooks/use-hero-promo-offer";
import { GptFeaturedCheckoutCta } from "@/components/landing/GptFeaturedCheckoutCta";

export function FinalCtaSection() {
  const { offer, loading } = useHeroPromoOffer("gpt");
  const promo = Boolean(offer?.promoActive);

  return (
    <section id="final-cta" className="relative overflow-hidden py-14 md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(16,163,127,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative z-10 mx-auto max-w-3xl px-4 text-center"
      >
        <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-4xl">
          Подключите ChatGPT Plus без иностранной карты
        </h2>
        <p className="mt-3 text-base text-gray-500 md:text-lg">
          Оплата в рублях. Обычно подключение занимает 5–15 минут.
        </p>

        {offer ? (
          <div className="mt-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
            {promo ? (
              <span className="font-heading text-base font-semibold text-gray-400 line-through">
                {offer.originalPrice.toLocaleString("ru")} ₽
              </span>
            ) : null}
            <p className="font-heading text-3xl font-bold text-gray-900">
              {offer.salePrice.toLocaleString("ru")} ₽
              <span className="ml-1 text-base font-semibold text-gray-500">/ месяц</span>
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <GptFeaturedCheckoutCta
            offer={offer}
            loading={loading}
            trackSource="landing_final_cta"
            className="md:min-w-[22rem]"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {[
            { icon: ShieldCheck, text: "Гарантия" },
            { icon: CreditCard, text: "Оплата в ₽" },
            { icon: Headphones, text: "Поддержка" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500 md:text-sm">
              <Icon size={14} className="text-[#10a37f]" aria-hidden />
              {text}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
