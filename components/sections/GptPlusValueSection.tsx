"use client";

import { motion } from "framer-motion";
import { FileSearch, Image as ImageIcon, Search, Sparkles } from "lucide-react";
import { PRODUCTS } from "@/lib/chatgpt-data";
import { fadeUp, staggerContainer } from "@/lib/motion-config";

const ICONS = [Sparkles, ImageIcon, FileSearch, Search];

export function GptPlusValueSection() {
  const plus = PRODUCTS.find((p) => p.id === "chatgpt-plus");
  if (!plus) return null;

  return (
    <section id="plus-value" className="px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-10 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            ChatGPT Plus
          </span>
          <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-4xl">
            Что вы получите после подключения
          </h2>
          <p className="max-w-2xl text-base text-gray-500 md:text-lg">{plus.description}</p>
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          {plus.features.map((feature, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <motion.li
                key={feature}
                variants={fadeUp}
                className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm md:p-5"
              >
                <Icon className="mb-2 h-5 w-5 text-[#10a37f]" aria-hidden />
                <p className="font-heading text-sm font-semibold text-gray-900">{feature}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
