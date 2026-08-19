"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { capturePromoFromSearchParams } from "@/lib/checkout/promo-capture";

/** Сохраняет ?promo= / ?promocode= из рекламы (Яндекс «Скопировать и перейти») до чекаута. */
export function PromoCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    capturePromoFromSearchParams(searchParams);
  }, [searchParams]);

  return null;
}
