"use client";

import { CheckCircle2, CreditCard, MessageCircle, Shield, Star, Zap } from "lucide-react";
import { SPOTIFY_ACCENT, SPOTIFY_TRUST_BAR_ITEMS } from "@/lib/content/spotify";

const ICONS = {
  check: CheckCircle2,
  star: Star,
  shield: Shield,
  card: CreditCard,
  bolt: Zap,
  chat: MessageCircle,
} as const;

export function SpotifyTicker() {
  return (
    <div
      className="shrink-0 py-3 md:py-4"
      style={{
        background: "rgba(29,185,84,0.06)",
        borderTop: "1px solid rgba(29,185,84,0.15)",
        borderBottom: "1px solid rgba(29,185,84,0.15)",
      }}
    >
      <ul className="mx-auto grid w-full max-w-[72rem] grid-cols-2 gap-x-3 gap-y-2.5 px-4 sm:grid-cols-3 md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-5 md:px-8 lg:px-11">
        {SPOTIFY_TRUST_BAR_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={item.label}
              className="inline-flex items-center gap-2.5 text-xs font-medium md:text-sm"
              style={{ color: "rgba(255,255,255,0.62)" }}
            >
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(29,185,84,0.14)" }}
              >
                <Icon
                  className={`h-4 w-4 md:h-5 md:w-5 ${item.icon === "star" ? "fill-amber-400 text-amber-400" : ""}`}
                  style={item.icon === "star" ? undefined : { color: SPOTIFY_ACCENT }}
                  aria-hidden
                />
              </span>
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
