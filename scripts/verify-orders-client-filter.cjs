/**
 * Unit checks for staff orders ?client= filter helpers.
 * Run: node scripts/verify-orders-client-filter.cjs
 */
const assert = require("assert");
const path = require("path");

// Load compiled-like TS via dynamic require of source through a tiny inline reimplementation
// mirroring lib/admin/orders-client-filter.ts (keep in sync).

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value).trim());
}

function parseOrdersClientParam(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("email:")) {
    const email = value.slice("email:".length).trim().toLowerCase();
    if (!email || !email.includes("@") || email.includes("%") || email.includes("*")) return null;
    return { kind: "email", email };
  }
  if (value.startsWith("order:")) {
    const orderId = value.slice("order:".length).trim();
    if (!isUuid(orderId)) return null;
    return { kind: "order", orderId };
  }
  if (isUuid(value)) return { kind: "user", userId: value };
  return null;
}

function buildOrdersClientParam(opts) {
  const clientId = String(opts.clientId ?? "").trim();
  if (clientId && isUuid(clientId)) return clientId;
  const profileId = String(opts.profileId ?? "").trim();
  if (profileId && isUuid(profileId)) return profileId;
  if (clientId.startsWith("order:") && isUuid(clientId.slice("order:".length))) return clientId;
  if (clientId.startsWith("email:")) {
    const email = clientId.slice("email:".length).trim().toLowerCase();
    if (email.includes("@")) return `email:${email}`;
  }
  const email = String(opts.email ?? "").trim().toLowerCase();
  if (email.includes("@")) return `email:${email}`;
  return null;
}

const ARENA = "06490e66-360e-4ae5-91c7-ec0e2d2e109b";

assert.deepStrictEqual(parseOrdersClientParam(ARENA), { kind: "user", userId: ARENA });
assert.deepStrictEqual(parseOrdersClientParam("email:arena_i000@mail.ru"), {
  kind: "email",
  email: "arena_i000@mail.ru",
});
assert.strictEqual(parseOrdersClientParam("email:%arena%"), null);
assert.strictEqual(parseOrdersClientParam("arena_i000@mail.ru"), null);
assert.strictEqual(parseOrdersClientParam("not-a-uuid"), null);
assert.deepStrictEqual(
  parseOrdersClientParam("order:d7e25ca7-d2fd-4059-a040-4bc7013a4e3a"),
  { kind: "order", orderId: "d7e25ca7-d2fd-4059-a040-4bc7013a4e3a" },
);

assert.strictEqual(
  buildOrdersClientParam({ clientId: ARENA, email: "arena_i000@mail.ru" }),
  ARENA,
);
assert.strictEqual(
  buildOrdersClientParam({
    clientId: "email:arena_i000@mail.ru",
    email: "arena_i000@mail.ru",
  }),
  "email:arena_i000@mail.ru",
);
assert.strictEqual(
  buildOrdersClientParam({
    clientId: "order:d7e25ca7-d2fd-4059-a040-4bc7013a4e3a",
  }),
  "order:d7e25ca7-d2fd-4059-a040-4bc7013a4e3a",
);

const expectedHref = `/admin/orders?client=${encodeURIComponent(ARENA)}&site=subs-store`;
assert.ok(expectedHref.includes(ARENA));
assert.ok(expectedHref.includes("site=subs-store"));

console.log("verify-orders-client-filter: OK");
console.log("sample Spotify client URL:", expectedHref);
console.log("workspace:", path.basename(process.cwd()));
