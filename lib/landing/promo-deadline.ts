const MOSCOW_TZ = "Europe/Moscow";

export type PromoDeadline = {
  year: number;
  month: number;
  day: number;
};

export type PromoWindow = {
  /** Inclusive Moscow calendar day */
  start: PromoDeadline;
  /** Inclusive Moscow calendar day */
  end: PromoDeadline;
};

function moscowDateParts(date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MOSCOW_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

function ymdToUtcDay(d: PromoDeadline): number {
  return Date.UTC(d.year, d.month - 1, d.day);
}

/** Календарные дни от «сегодня» (МСК) до deadline включительно. На deadline = 0. После — отрицательное. */
export function getDaysUntilPromoDeadline(deadline: PromoDeadline, now = new Date()): number {
  const today = moscowDateParts(now);
  return Math.round((ymdToUtcDay(deadline) - ymdToUtcDay(today)) / 86_400_000);
}

/** Активна ли акция в календарном окне [start, end] по Europe/Moscow. */
export function isPromoWindowActive(window: PromoWindow, now = new Date()): boolean {
  const today = moscowDateParts(now);
  const t = ymdToUtcDay(today);
  return t >= ymdToUtcDay(window.start) && t <= ymdToUtcDay(window.end);
}

/** @deprecated Prefer isPromoWindowActive — оставлен для совместимости (только end date). */
export function isPromoDeadlineActive(deadline: PromoDeadline, now = new Date()): boolean {
  return getDaysUntilPromoDeadline(deadline, now) >= 0;
}

export function formatPromoDeadlineLabel(deadline: PromoDeadline): string {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const monthLabel = months[deadline.month - 1] ?? "августа";
  return `${deadline.day} ${monthLabel}`;
}

export function pluralDaysRu(count: number): string {
  const n = Math.abs(count);
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} дней`;
  if (mod10 === 1) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} дня`;
  return `${n} дней`;
}

/**
 * Countdown copy for active promo. daysLeft must be >= 0 (caller gates inactive window).
 * Never returns negative wording.
 */
export function promoCountdownLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "Последний день акции";
  if (daysLeft === 1) return "Остался 1 день";
  if (daysLeft <= 5) return `Осталось ${pluralDaysRu(daysLeft)}`;
  return `До конца акции осталось ${pluralDaysRu(daysLeft)}`;
}

/** Legacy helper used by older cards — maps to new countdown + end label. */
export function promoDaysLeftLabel(daysLeft: number, deadlineLabel: string): string {
  if (daysLeft <= 0) return `Последний день — до ${deadlineLabel}`;
  return `Осталось ${pluralDaysRu(daysLeft)} — до ${deadlineLabel}`;
}

export function formatPromoPeriodRange(window: PromoWindow): string {
  const months = [
    "",
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const { start, end } = window;
  if (start.year === end.year && start.month === end.month) {
    const monthLabel = months[end.month] ?? "";
    return `${start.day}–${end.day} ${monthLabel}`.trim();
  }
  return `${start.day}.${String(start.month).padStart(2, "0")}–${end.day}.${String(end.month).padStart(2, "0")}.${end.year}`;
}
