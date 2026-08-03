/**
 * Admin dashboard period helpers (Europe/Moscow calendar bounds).
 */

import {
  moscowDayEndIso,
  moscowDayStartIso,
  moscowMonthStartYmd,
  moscowTodayYmd,
} from "@/lib/admin/revenue-stats";

export type DashboardPeriodPreset =
  | "today"
  | "7d"
  | "month"
  | "all"
  | "custom";

export type DashboardPeriod = {
  preset: DashboardPeriodPreset;
  /** Inclusive Moscow calendar day YYYY-MM-DD (null = unbounded). */
  fromYmd: string | null;
  toYmd: string | null;
  fromIso: string | null;
  toIso: string | null;
  label: string;
};

function addMoscowDays(ymd: string, deltaDays: number): string {
  const base = new Date(`${ymd}T12:00:00+03:00`);
  const shifted = new Date(base.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return moscowTodayYmd(shifted);
}

function isYmd(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function resolveDashboardPeriod(params: {
  period?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): DashboardPeriod {
  const now = params.now ?? new Date();
  const today = moscowTodayYmd(now);
  const raw = (params.period ?? "month").trim().toLowerCase();

  if (raw === "all") {
    return {
      preset: "all",
      fromYmd: null,
      toYmd: null,
      fromIso: null,
      toIso: null,
      label: "Всё время",
    };
  }

  if (raw === "today") {
    return {
      preset: "today",
      fromYmd: today,
      toYmd: today,
      fromIso: moscowDayStartIso(today),
      toIso: moscowDayEndIso(today),
      label: `Сегодня (${today})`,
    };
  }

  if (raw === "7d") {
    const fromYmd = addMoscowDays(today, -6);
    return {
      preset: "7d",
      fromYmd,
      toYmd: today,
      fromIso: moscowDayStartIso(fromYmd),
      toIso: moscowDayEndIso(today),
      label: `Последние 7 дней (${fromYmd} — ${today})`,
    };
  }

  if (raw === "custom" && isYmd(params.from) && isYmd(params.to)) {
    const fromYmd = params.from <= params.to ? params.from : params.to;
    const toYmd = params.from <= params.to ? params.to : params.from;
    return {
      preset: "custom",
      fromYmd,
      toYmd,
      fromIso: moscowDayStartIso(fromYmd),
      toIso: moscowDayEndIso(toYmd),
      label: `${fromYmd} — ${toYmd}`,
    };
  }

  // default: current Moscow calendar month
  const fromYmd = moscowMonthStartYmd(now);
  return {
    preset: "month",
    fromYmd,
    toYmd: today,
    fromIso: moscowDayStartIso(fromYmd),
    toIso: moscowDayEndIso(today),
    label: `Текущий месяц (${fromYmd} — ${today})`,
  };
}

export function dashboardPeriodQuery(period: DashboardPeriod): string {
  const q = new URLSearchParams();
  q.set("period", period.preset);
  if (period.preset === "custom" && period.fromYmd && period.toYmd) {
    q.set("from", period.fromYmd);
    q.set("to", period.toYmd);
  }
  return q.toString();
}
