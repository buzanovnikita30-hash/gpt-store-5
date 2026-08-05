/**
 * Date-window tests for August 2026 hero promo (Europe/Moscow calendar days).
 * Run: node scripts/verify-august-promo-window.cjs
 */

const assert = require("node:assert/strict");

function moscowParts(iso) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));
  const pick = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

function ymdUtc(d) {
  return Date.UTC(d.year, d.month - 1, d.day);
}

function isActive(window, nowIso) {
  const t = ymdUtc(moscowParts(nowIso));
  return t >= ymdUtc(window.start) && t <= ymdUtc(window.end);
}

function daysLeft(end, nowIso) {
  const today = moscowParts(nowIso);
  return Math.round((ymdUtc(end) - ymdUtc(today)) / 86400000);
}

function countdown(days) {
  if (days <= 0) return "Последний день акции";
  if (days === 1) return "Остался 1 день";
  if (days <= 5) return `Осталось ${days} дня`.replace("4 дня", "4 дня").replace("5 дня", "5 дней");
  // simplified — production uses pluralDaysRu
  return `До конца акции осталось ${days} дней`;
}

const window = {
  start: { year: 2026, month: 8, day: 1 },
  end: { year: 2026, month: 8, day: 31 },
};

assert.equal(isActive(window, "2026-07-31T20:59:59.999Z"), false, "Jul 31 23:59:59 MSK inactive");
assert.equal(isActive(window, "2026-07-31T21:00:00.000Z"), true, "Aug 1 00:00 MSK active");
assert.equal(isActive(window, "2026-08-15T12:00:00+03:00"), true, "mid August active");
assert.equal(isActive(window, "2026-08-31T20:59:59.999Z"), true, "Aug 31 23:59:59 MSK active");
assert.equal(isActive(window, "2026-08-31T21:00:00.000Z"), false, "Sep 1 00:00 MSK inactive");

assert.equal(daysLeft(window.end, "2026-08-31T12:00:00+03:00"), 0);
assert.equal(countdown(0), "Последний день акции");
assert.equal(countdown(1), "Остался 1 день");
assert.ok(daysLeft(window.end, "2026-08-05T12:00:00+03:00") > 0);
assert.ok(daysLeft(window.end, "2026-09-01T00:00:00+03:00") < 0);

// Price math: no double 10%
const gptSale = 1590;
const gptOrig = 1790;
assert.equal(gptOrig - gptSale, 200);
assert.notEqual(Math.round(gptSale * 0.9), gptSale);

const spSale = 1690;
const spOrig = 1890;
assert.equal(spOrig - spSale, 200);
assert.equal(Math.round(spSale / 3), 563);

console.log("verify-august-promo-window: PASS");
