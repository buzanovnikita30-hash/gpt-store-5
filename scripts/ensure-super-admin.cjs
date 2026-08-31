/**
 * Ensure SUPER_ADMIN_EMAIL exists in GPT + Subs Auth, with password from env.
 * Usage: SUPER_ADMIN_PASSWORD='...' node scripts/ensure-super-admin.cjs
 * Does not print the password.
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const EMAIL = "karvanenigor98@gmail.com";

async function findUserId(admin, email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((u) => (u.email || "").toLowerCase() === target);
    if (found) return found.id;
    if (users.length < 200) return null;
  }
  return null;
}

async function ensureOnProject(label, url, serviceKey, password, profileRole) {
  if (!url || !serviceKey) {
    console.log(`${label}: skip (missing url/key)`);
    return;
  }
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId = await findUserId(admin, EMAIL);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw new Error(`${label} createUser: ${error.message}`);
    userId = data.user.id;
    console.log(`${label}: created ${userId}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw new Error(`${label} updateUser: ${error.message}`);
    console.log(`${label}: password+confirm updated ${userId}`);
  }

  const { error: profileErr } = await admin.from("profiles").upsert(
    { id: userId, email: EMAIL, role: profileRole },
    { onConflict: "id" },
  );
  if (profileErr) {
    console.log(`${label}: profiles upsert warn: ${profileErr.message}`);
  } else {
    console.log(`${label}: profiles.role=${profileRole}`);
  }

  for (const site_slug of ["gpt-store", "subs-store"]) {
    const { error } = await admin.from("site_memberships").upsert(
      { user_id: userId, site_slug, role: "admin" },
      { onConflict: "user_id,site_slug" },
    );
    if (error) console.log(`${label}: membership ${site_slug} warn: ${error.message}`);
  }
}

async function main() {
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error("Set SUPER_ADMIN_PASSWORD (min 8 chars). Do not commit it.");
    process.exit(1);
  }

  await ensureOnProject(
    "gpt",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    password,
    "admin",
  );
  await ensureOnProject(
    "subs",
    process.env.NEXT_PUBLIC_SUBS_SUPABASE_URL,
    process.env.SUBS_SUPABASE_SERVICE_ROLE_KEY,
    password,
    "super_admin",
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
