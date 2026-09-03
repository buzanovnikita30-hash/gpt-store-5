"use client";

import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@/lib/chatgpt-data";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/motion-config";
import { chatLandingLucideIcon } from "@/components/sections/chatgpt-landing-icons";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-10 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            Процесс подключения
          </span>
          <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-4xl">
            Как подключить ChatGPT Plus
          </h2>
          <p className="max-w-2xl text-base text-gray-500 md:text-lg">
            Обычно весь процесс занимает 5–15 минут
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid gap-4 md:grid-cols-3 md:gap-6"
        >
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = chatLandingLucideIcon(step.icon);
            return (
              <motion.article
                key={step.title}
                variants={scaleIn}
                className="relative rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-heading text-sm font-bold tabular-nums text-[#10a37f]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#10a37f]/15 bg-[#10a37f]/10">
                    <Icon size={20} color="#10a37f" className="shrink-0" aria-hidden />
                  </div>
                </div>
                <h3 className="font-heading text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
