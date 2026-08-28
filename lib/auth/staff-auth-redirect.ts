import {
  isStaffClientCabinetView,
  staffPanelHomeForRole,
} from "@/lib/auth/staff-cabinet-access";
import { resolvePostLoginPath } from "@/lib/auth/postLoginPath";
import type { UserRole } from "@/types/database";

export function staffPanelHome(role: UserRole): "/admin" | "/operator" | null {
  return staffPanelHomeForRole(role);
}

export function staffLoginUrl(returnPath: string): string {
  const safe =
    returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/admin";
  return `/login?returnUrl=${encodeURIComponent(safe)}&site=gpt-store`;
}

/** Куда отправить уже авторизованного staff после /login. */
export function resolveStaffAuthRedirect(role: UserRole, returnUrl: string | null | undefined): string {
  const safe =
    returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : "";

  if (role === "admin") {
    if (safe.startsWith("/operator")) return "/admin";
    if (safe.startsWith("/admin")) return safe;
    if ((safe.startsWith("/dashboard") || safe.startsWith("/cabinet")) && !isStaffClientCabinetView(safe)) {
      return "/admin";
    }
    if (isStaffClientCabinetView(safe)) return safe;
    return "/admin";
  }

  if (role === "operator") {
    if (safe.startsWith("/admin")) return safe.replace(/^\/admin/, "/operator") || "/operator";
    if (safe.startsWith("/operator")) return safe;
    if ((safe.startsWith("/dashboard") || safe.startsWith("/cabinet")) && !isStaffClientCabinetView(safe)) {
      return "/operator";
    }
    if (isStaffClientCabinetView(safe)) return safe;
    return "/operator";
  }

  if (safe.startsWith("/admin") || safe.startsWith("/operator")) {
    return "/dashboard?site=gpt-store";
  }

  return resolvePostLoginPath(safe || "/dashboard?site=gpt-store", role);
}
