import { resolveRoleByEmail } from "@/lib/auth/resolveRole";
import { isSuperAdminEmail } from "@/lib/auth/superAdmin";
import type { UserRole } from "@/types/database";

/** Роль staff без БД: env + hardcoded super-admin. */
export function fastStaffRoleFromEmail(email: string | null | undefined): "admin" | "operator" | null {
  if (isSuperAdminEmail(email)) return "admin";
  const fromEnv = resolveRoleByEmail(email);
  if (fromEnv === "admin" || fromEnv === "operator") return fromEnv;
  return null;
}

export function roleFromEmailFallback(email: string | null | undefined): UserRole {
  return fastStaffRoleFromEmail(email) ?? "client";
}
