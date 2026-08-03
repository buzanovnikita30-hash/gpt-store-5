"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  siteSlug: "gpt-store" | "subs-store";
  accentClass: string;
};

const PRESETS: Array<{ id: string; label: string }> = [
  { id: "today", label: "Сегодня" },
  { id: "7d", label: "7 дней" },
  { id: "month", label: "Месяц" },
  { id: "all", label: "Всё время" },
  { id: "custom", label: "Период" },
];

export function DashboardPeriodControls({ siteSlug, accentClass }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "month";
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  function navigate(next: { period: string; from?: string; to?: string }) {
    const q = new URLSearchParams();
    q.set("site", siteSlug);
    q.set("period", next.period);
    if (next.period === "custom") {
      if (next.from) q.set("from", next.from);
      if (next.to) q.set("to", next.to);
    }
    router.push(`?${q.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (p.id === "custom") {
                navigate({
                  period: "custom",
                  from: from || searchParams.get("from") || "",
                  to: to || searchParams.get("to") || "",
                });
                return;
              }
              navigate({ period: p.id });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              period === p.id
                ? accentClass
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!from || !to) return;
            navigate({ period: "custom", from, to });
          }}
        >
          <label className="text-xs text-gray-500">
            С
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-800"
            />
          </label>
          <label className="text-xs text-gray-500">
            По
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-800"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Применить
          </button>
        </form>
      ) : null}
    </div>
  );
}
