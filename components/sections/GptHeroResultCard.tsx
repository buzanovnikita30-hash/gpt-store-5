"use client";

import { Check } from "lucide-react";
import { HERO_RESULT_LINES } from "@/lib/chatgpt-data";

export function GptHeroResultCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#10a37f]/25 bg-white p-5 shadow-[0_8px_32px_rgba(16,163,127,0.08)] md:p-6 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 100% 0%, rgba(16,163,127,0.10) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="font-heading text-lg font-semibold text-gray-900">ChatGPT Plus</p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#10a37f]/20 bg-[#10a37f]/8 px-2.5 py-1 text-xs font-medium text-[#0f7d62]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10a37f] opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10a37f]" />
          </span>
          Подписка активна
        </p>
        <ul className="mt-5 space-y-2.5">
          {HERO_RESULT_LINES.map((line) => (
            <li key={line} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 shrink-0 text-[#10a37f]" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-gray-50 px-3 py-3">
          <p className="text-xs text-gray-500">Среднее время подключения</p>
          <p className="mt-0.5 font-heading text-base font-semibold text-gray-900">5–15 минут</p>
        </div>
      </div>
    </div>
  );
}
