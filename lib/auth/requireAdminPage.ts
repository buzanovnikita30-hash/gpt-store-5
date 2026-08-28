import { redirect } from "next/navigation";

import { loadGptStaffAuth, staffLoginUrl } from "@/lib/auth/staff-access";
import type { UserRole } from "@/types/database";

/**
 * Только admin: операторов и клиентов перенаправляем.
 */
export async function requireAdminPage(): Promise<{
  role: "admin";
}> {
  const auth = await loadGptStaffAuth();
  if (!auth.user) {
    redirect(staffLoginUrl("/admin"));
  }
  const role: UserRole = auth.role;
  if (role === "operator") {
    redirect("/operator?site=gpt-store");
  }
  if (role !== "admin") {
    redirect("/dashboard?site=gpt-store");
  }
  return { role: "admin" };
}
