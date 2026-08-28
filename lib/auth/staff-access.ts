import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import { StaffAuthUnavailableError } from "@/lib/auth/staff-auth-errors";
import { staffLoginUrl } from "@/lib/auth/staff-auth-redirect";
import { resolveServerRole } from "@/lib/auth/server-role";
import { tryCreateClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type StaffPanel = "admin" | "operator";
export {
  resolveStaffAuthRedirect,
  staffLoginUrl,
  staffPanelHome,
} from "@/lib/auth/staff-auth-redirect";

const STAFF_USER_LOOKUP_MS = 6_000;
const STAFF_ROLE_LOOKUP_MS = 6_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Один probe на RSC-запрос: getUser (без лишнего getSession) + роль.
 * Timeout → StaffAuthUnavailableError (терминальный UI), не «гость».
 */
export const loadGptStaffAuth = cache(async (): Promise<{ user: User | null; role: UserRole }> => {
  let user: User | null;
  try {
    const supabase = await tryCreateClient();
    if (!supabase) {
      throw new StaffAuthUnavailableError("Supabase client unavailable");
    }
    const result = await withTimeout(supabase.auth.getUser(), STAFF_USER_LOOKUP_MS, "staff_user_timeout");
    user = result.data.user ?? null;
  } catch (err) {
    if (err instanceof StaffAuthUnavailableError) throw err;
    if (err instanceof Error && err.message === "staff_user_timeout") {
      throw new StaffAuthUnavailableError();
    }
    throw new StaffAuthUnavailableError();
  }

  if (!user) {
    return { user: null, role: "client" };
  }

  try {
    const role = await withTimeout(resolveServerRole(user), STAFF_ROLE_LOOKUP_MS, "staff_role_timeout");
    return { user, role };
  } catch (err) {
    if (err instanceof Error && err.message === "staff_role_timeout") {
      throw new StaffAuthUnavailableError();
    }
    throw err;
  }
});

export async function getGptStaffSessionUser(): Promise<User | null> {
  const auth = await loadGptStaffAuth();
  return auth.user;
}

/** Guard для /admin и /operator layouts — единая логика роли и login redirect. */
export async function requireStaffPanel(
  panel: StaffPanel,
  returnPath: string,
): Promise<{ user: User; role: StaffPanel }> {
  const auth = await loadGptStaffAuth();
  if (!auth.user) {
    redirect(staffLoginUrl(returnPath));
  }

  const role = auth.role;
  if (role === "admin") {
    if (panel === "operator") {
      redirect(returnPath.replace(/^\/operator/, "/admin") || "/admin");
    }
    return { user: auth.user, role: "admin" };
  }

  if (role === "operator") {
    if (panel === "admin") {
      redirect(returnPath.replace(/^\/admin/, "/operator") || "/operator");
    }
    return { user: auth.user, role: "operator" };
  }

  redirect("/dashboard?site=gpt-store");
}
