/**
 * Lightweight regression checks for hero plan selection + player preview.
 * Run: node --experimental-strip-types scripts/verify-hero-featured-plan.cjs
 * (or via tsx if available)
 */

const assert = require("node:assert/strict");

// Inline mirrors of resolve logic so the script stays zero-deps on Next path aliases.
function resolveHeroCheckoutPlan(plans, featuredPlanId) {
  const active = plans.filter((p) => p.price > 0);
  if (!active.length) return null;
  const featured = active.find((p) => p.id === featuredPlanId);
  if (featured) return featured;
  const popularDuo = active.find((p) => p.tab === "duo" && p.isPopular);
  if (popularDuo) return popularDuo;
  const anyDuo = active.filter((p) => p.tab === "duo").sort((a, b) => a.price - b.price);
  if (anyDuo[0]) return anyDuo[0];
  return active.reduce((best, p) => (p.price < best.price ? p : best));
}

const plans = [
  { id: "spotify-new-account", tab: "individual", name: "Новый", price: 440 },
  { id: "spotify-ind-1m", tab: "individual", name: "1 месяц", price: 490 },
  { id: "spotify-duo-3m", tab: "duo", name: "3 месяца", price: 1690, isPopular: true },
  { id: "spotify-duo-1m", tab: "duo", name: "1 месяц", price: 790 },
];

const featured = resolveHeroCheckoutPlan(plans, "spotify-duo-3m");
assert.equal(featured?.id, "spotify-duo-3m", "featured must be duo-3m, not min individual 440");
assert.notEqual(featured?.id, "spotify-new-account");

const withoutFeatured = resolveHeroCheckoutPlan(
  plans.filter((p) => p.id !== "spotify-duo-3m"),
  "spotify-duo-3m",
);
assert.equal(withoutFeatured?.tab, "duo", "fallback to popular duo");

console.log("verify-hero-featured-plan: PASS");
