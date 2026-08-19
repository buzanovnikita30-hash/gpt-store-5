const STORAGE_KEY = "store_captured_promo";
const PROMO_QUERY_KEYS = ["promo", "promocode", "promo_code", "coupon"] as const;
const PROMO_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

export function normalizePromoCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (!code || !PROMO_CODE_RE.test(code)) return null;
  return code;
}

export function parsePromoFromSearchParams(
  searchParams: { get(name: string): string | null } | URLSearchParams,
): string | null {
  for (const key of PROMO_QUERY_KEYS) {
    const parsed = normalizePromoCode(searchParams.get(key));
    if (parsed) return parsed;
  }
  return null;
}

export function writeCapturedPromo(code: string): void {
  if (typeof window === "undefined") return;
  const parsed = normalizePromoCode(code);
  if (!parsed) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, parsed);
  } catch {
    /* private mode */
  }
}

export function readCapturedPromo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizePromoCode(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function capturePromoFromSearchParams(
  searchParams: { get(name: string): string | null } | URLSearchParams,
): string | null {
  const fromUrl = parsePromoFromSearchParams(searchParams);
  if (fromUrl) writeCapturedPromo(fromUrl);
  return fromUrl ?? readCapturedPromo();
}

export function withPromoQuery(path: string, promoCode?: string | null): string {
  const code = normalizePromoCode(promoCode);
  if (!code) return path;
  const url = new URL(path, "https://local.invalid");
  url.searchParams.set("promo", code);
  return `${url.pathname}${url.search}${url.hash}`;
}
