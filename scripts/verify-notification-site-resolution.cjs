/**
 * Unit checks: staff notification site resolution / merge stamp / dedupe.
 * No network. Mirrors the fixed client logic.
 */
const assert = require("assert");

function resolveRowSiteSlug(row, apiSource) {
  if (row.site_slug === "subs-store" || row.site_slug === "gpt-store") return row.site_slug;
  if (row.site_id === "subs-store" || row.site_id === "gpt-store") return row.site_id;
  if (apiSource === "subs-store") return "subs-store";
  return "gpt-store";
}

function dedupeStaffNotificationRows(rows) {
  const byEntity = new Map();
  const withoutEntity = [];
  for (const row of rows) {
    const et = (row.entity_type || "").trim();
    const eid = (row.entity_id || "").trim();
    const type = (row.type || "").trim();
    if (!et || !eid || !type) {
      withoutEntity.push(row);
      continue;
    }
    const key = `${type}:${et}:${eid}`;
    const prev = byEntity.get(key);
    if (!prev) {
      byEntity.set(key, row);
      continue;
    }
    const prefer =
      row.site_id === "subs-store" && prev.site_id !== "subs-store"
        ? row
        : prev.site_id === "subs-store"
          ? prev
          : new Date(row.created_at).getTime() >= new Date(prev.created_at).getTime()
            ? row
            : prev;
    byEntity.set(key, prefer);
  }
  return [...byEntity.values(), ...withoutEntity];
}

function resolveAlertSiteSlug(siteId, uuidMap) {
  if (!siteId) return null;
  if (siteId === "subs-store" || siteId === "gpt-store") return siteId;
  if (uuidMap?.subs && siteId === uuidMap.subs) return "subs-store";
  if (uuidMap?.gpt && siteId === uuidMap.gpt) return "gpt-store";
  return null;
}

const SUBS_UUID = "5d20f2ba-4ca8-4cba-8259-5dcc0bb30698";
const GPT_UUID = "d4aead3e-41ed-4873-8ee2-fbce9e873e47";

// Reproduce evaalasania1337 bug: GPT API returned UUID, old hook stamped gpt-store
const gptApiRow = {
  id: "ea965f2e-e879-49b0-b8c6-01bd9c22356d",
  type: "new_order",
  entity_type: "order",
  entity_id: "19130063-0ff9-47be-a78b-2597349732ad",
  site_id: SUBS_UUID,
  site_slug: "subs-store", // new API maps UUID → slug then filters; if leaked, slug is truth
  created_at: "2026-07-30T09:42:34.664Z",
  title: "Новый заказ",
  message: "1 месяц · 490 ₽ · evaalasania1337@gmail.com",
};

const subsApiRow = {
  id: "5f40a6fd-13fc-4f98-b810-0ad86d35e71f",
  type: "new_order",
  entity_type: "order",
  entity_id: "19130063-0ff9-47be-a78b-2597349732ad",
  site_slug: "subs-store",
  created_at: "2026-07-30T09:46:39.868Z",
  title: "Новый заказ",
  message: "1 месяц · 490 ₽ · evaalasania1337@gmail.com",
};

// After API fix, GPT feed should not include subs UUID rows.
// If it did with site_slug, resolve must NOT invent gpt-store from fetch route.
assert.strictEqual(resolveRowSiteSlug(gptApiRow, "gpt-store"), "subs-store");
assert.strictEqual(resolveRowSiteSlug(subsApiRow, "subs-store"), "subs-store");

// Old bug simulation: overwriting with route slug
const buggy = { ...gptApiRow, site_id: "gpt-store" };
assert.notStrictEqual(buggy.site_id, "subs-store");

const merged = [
  { ...gptApiRow, site_id: resolveRowSiteSlug(gptApiRow, "gpt-store") },
  { ...subsApiRow, site_id: resolveRowSiteSlug(subsApiRow, "subs-store") },
];
const deduped = dedupeStaffNotificationRows(merged);
assert.strictEqual(deduped.length, 1);
assert.strictEqual(deduped[0].site_id, "subs-store");

assert.strictEqual(resolveAlertSiteSlug(SUBS_UUID, { gpt: GPT_UUID, subs: SUBS_UUID }), "subs-store");
assert.strictEqual(resolveAlertSiteSlug(GPT_UUID, { gpt: GPT_UUID, subs: SUBS_UUID }), "gpt-store");
assert.strictEqual(resolveAlertSiteSlug(SUBS_UUID, null), null); // no GPT invent
assert.strictEqual(resolveAlertSiteSlug("subs-store"), "subs-store");

console.log("verify-notification-site-resolution: OK");
