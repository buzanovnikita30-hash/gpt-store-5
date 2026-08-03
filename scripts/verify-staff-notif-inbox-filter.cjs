/**
 * Documents staff inbox filter rule for Subs notifications API.
 * Customer rows (recipient != shared inbox) must be excluded for ALL types.
 */
const assert = require("assert");

function isStaffFeedRow(row, sharedInboxUserId) {
  const t = row.type;
  if (t === "chat_reply") return false;
  const recipient = row.recipient_user_id;
  if (!recipient) return true;
  if (sharedInboxUserId && recipient === sharedInboxUserId) return true;
  return false;
}

const INBOX = "aff8e440-ce1b-4822-ae48-2c9bb192547d";
const CUSTOMER = "06490e66-360e-4ae5-91c7-ec0e2d2e109b";

assert.strictEqual(
  isStaffFeedRow({ type: "new_order", recipient_user_id: INBOX }, INBOX),
  true,
);
assert.strictEqual(
  isStaffFeedRow({ type: "new_order", recipient_user_id: CUSTOMER }, INBOX),
  false,
);
assert.strictEqual(
  isStaffFeedRow({ type: "payment_success", recipient_user_id: CUSTOMER }, INBOX),
  false,
  "BUG: customer payment_success must not appear in staff feed",
);
assert.strictEqual(
  isStaffFeedRow({ type: "payment_success", recipient_user_id: INBOX }, INBOX),
  true,
);
assert.strictEqual(
  isStaffFeedRow({ type: "order_activated", recipient_user_id: CUSTOMER }, INBOX),
  false,
);

console.log("verify-staff-notif-inbox-filter: OK");
