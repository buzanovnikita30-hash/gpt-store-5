"use client";

import { motion } from "framer-motion";
import { CreditCard, Headphones, ShieldCheck, UserRound, Zap } from "lucide-react";
import { WHY_GPT_STORE_ITEMS } from "@/lib/chatgpt-data";
import { fadeUp, staggerContainer } from "@/lib/motion-config";

const ICONS = [CreditCard, UserRound, Zap, Headphones, ShieldCheck];

export function WhyGptStoreSection() {
  return (
    <section id="why-gpt-store" className="px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-10 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            Почему GPT STORE
          </span>
          <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-4xl">
            ChatGPT Plus без сложностей с оплатой
          </h2>
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {WHY_GPT_STORE_ITEMS.map((item, i) => {
            const Icon = ICONS[i] ?? CreditCard;
            return (
              <motion.li
                key={item.title}
                variants={fadeUp}
                className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm"
              >
                <Icon className="mb-3 h-5 w-5 text-[#10a37f]" aria-hidden />
                <h3 className="font-heading text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.description}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
