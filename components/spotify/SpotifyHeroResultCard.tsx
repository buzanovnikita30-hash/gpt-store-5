"use client";

import { Check } from "lucide-react";
import { SPOTIFY_ACCENT, SPOTIFY_HERO_RESULT_LINES } from "@/lib/content/spotify";

export function SpotifyHeroResultCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-6 md:p-8 lg:p-10 ${className}`}
      style={{
        borderColor: "rgba(29,185,84,0.35)",
        background: "linear-gradient(160deg, #141914 0%, #0a0c0a 55%, #121512 100%)",
        boxShadow:
          "0 0 0 5px rgba(29,185,84,0.08), 0 20px 40px rgba(29,185,84,0.14), 0 24px 64px rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 100% 0%, rgba(29,185,84,0.16) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div>
          <p className="font-heading text-2xl font-semibold leading-tight text-white md:text-3xl lg:text-4xl">
            Spotify Premium
          </p>
          <p
            className="mt-3 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-medium md:mt-4 md:text-base"
            style={{
              borderColor: "rgba(29,185,84,0.28)",
              background: "rgba(29,185,84,0.12)",
              color: SPOTIFY_ACCENT,
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 motion-reduce:animate-none"
                style={{ background: SPOTIFY_ACCENT }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: SPOTIFY_ACCENT }}
              />
            </span>
            Подписка активна
          </p>
        </div>
        <ul className="mt-6 flex flex-1 flex-col justify-evenly gap-3 md:mt-8">
          {SPOTIFY_HERO_RESULT_LINES.map((line) => (
            <li
              key={line}
              className="flex items-center gap-3.5 text-base font-medium text-white/90 md:text-lg lg:text-xl"
            >
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-12 md:w-12"
                style={{ background: "rgba(29,185,84,0.14)" }}
              >
                <Check
                  className="h-6 w-6 md:h-7 md:w-7"
                  style={{ color: SPOTIFY_ACCENT }}
                  strokeWidth={2.6}
                  aria-hidden
                />
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl px-5 py-4 md:mt-8 md:px-6 md:py-5" style={{ background: "rgba(255,255,255,0.05)" }}>
          <p className="text-sm text-white/50 md:text-base">Среднее время подключения</p>
          <p className="mt-1 font-heading text-xl font-semibold text-white md:text-2xl lg:text-3xl">
            10–15 минут
          </p>
        </div>
      </div>
    </div>
  );
}
