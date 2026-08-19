export type PromoCodeLike = {
  code: string;
  type: "percent" | "fixed";
  value: number;
};

export function applyPromo(price: number, promo: PromoCodeLike | null) {
  if (!promo) return { finalPrice: price, discountValue: 0 };
  const rawDiscount =
    promo.type === "percent"
      ? Math.round((price * promo.value) / 100)
      : Math.round(promo.value);
  const discountValue = Math.max(0, Math.min(price, rawDiscount));
  return { finalPrice: Math.max(0, price - discountValue), discountValue };
}
