"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { SELF_PAY_COMPARE_ROWS } from "@/lib/chatgpt-data";
import { fadeUp } from "@/lib/motion-config";

export function GptSelfPayCompareSection() {
  return (
    <section id="pay-compare" className="px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-8 flex flex-col items-center gap-3 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#10a37f]">
            Сравнение
          </span>
          <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-4xl">
            Почему это проще, чем оплачивать самостоятельно
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3 md:hidden">
          {SELF_PAY_COMPARE_ROWS.map((row) => (
            <article key={row.store} className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
              <p className="flex items-start gap-2 text-sm text-gray-400">
                <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide">Самостоятельно</span>
                  {row.self}
                </span>
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm font-medium text-gray-800">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10a37f]" aria-hidden />
                <span>
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-[#10a37f]">
                    GPT STORE
                  </span>
                  {row.store}
                </span>
              </p>
            </article>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="hidden overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm md:block"
        >
          <div className="grid grid-cols-2 border-b border-black/[0.06]">
            <div className="p-4 text-sm font-semibold text-gray-400">Самостоятельно</div>
            <div className="border-l border-black/[0.06] bg-[#10a37f]/5 p-4 text-sm font-semibold text-[#10a37f]">
              GPT STORE
            </div>
          </div>
          {SELF_PAY_COMPARE_ROWS.map((row, i) => (
            <div
              key={row.store}
              className="grid grid-cols-2 border-b border-black/[0.05] last:border-b-0"
              style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}
            >
              <div className="p-4 text-sm text-gray-600">{row.self}</div>
              <div className="border-l border-black/[0.05] bg-[#10a37f]/[0.03] p-4 text-sm font-medium text-gray-900">
                {row.store}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
