"use client";

import { CheckCircle2, CreditCard, MessageCircle, Shield, Star, Zap } from "lucide-react";
import { TRUST_BAR_ITEMS } from "@/lib/chatgpt-data";

const ICONS = {
  check: CheckCircle2,
  star: Star,
  shield: Shield,
  card: CreditCard,
  bolt: Zap,
  chat: MessageCircle,
} as const;

export function Ticker() {
  return (
    <div className="border-y border-black/[0.06] bg-white/80 py-3 md:py-3.5">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-3 gap-y-2.5 px-4 sm:grid-cols-3 md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:px-6">
        {TRUST_BAR_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.label} className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 md:text-sm">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${item.icon === "star" ? "fill-amber-400 text-amber-400" : "text-[#10a37f]"}`}
                aria-hidden
              />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
