"use client";

import { Check } from "lucide-react";
import { HERO_RESULT_LINES } from "@/lib/chatgpt-data";

export function GptHeroResultCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-[#10a37f]/30 bg-white p-5 shadow-[0_0_0_5px_rgba(16,163,127,0.06),0_20px_40px_rgba(16,163,127,0.12)] md:p-7 lg:p-9 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 100% 0%, rgba(16,163,127,0.12) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="font-heading text-xl font-semibold text-gray-900 md:text-2xl">ChatGPT Plus</p>
        <p className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-3 py-1 text-xs font-medium text-[#0f7d62]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10a37f] opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10a37f]" />
          </span>
          Подписка активна
        </p>
        <ul className="mt-5 space-y-3 md:mt-6 md:space-y-4">
          {HERO_RESULT_LINES.map((line) => (
            <li key={line} className="flex items-center gap-3 text-sm text-gray-700 md:text-base">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#10a37f]/12 md:h-10 md:w-10">
                <Check className="h-5 w-5 text-[#10a37f] md:h-6 md:w-6" strokeWidth={2.6} aria-hidden />
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Среднее время подключения</p>
          <p className="mt-0.5 font-heading text-lg font-semibold text-gray-900 md:text-xl">5–15 минут</p>
        </div>
      </div>
    </div>
  );
}
