"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { tryCreateSubsBrowserClient } from "@/lib/supabase/subs-browser-client";
import type { SiteSlug } from "@/lib/auth/siteUiSession";
import { coerceOrderStatus } from "@/lib/dashboard/order-status-tracker";

const API_POLL_MS = 3000;

export type OrderLiveStatusState = {
  status: string;
  paidLike: boolean;
  paidAt: string | null;
  /** Последняя ошибка poll (403/5xx/сеть) — не молчим на залипшем SSR. */
  pollError: string | null;
};

/**
 * Живой статус заказа: API poll (3s) + Realtime триггерит повторный poll.
 */
export function useOrderLiveStatus(
  orderId: string,
  siteSlug: SiteSlug,
  initialStatus: string | null | undefined,
): OrderLiveStatusState {
  const initial = coerceOrderStatus(initialStatus);
  const [state, setState] = useState<OrderLiveStatusState>(() => ({
    status: initial,
    paidLike: !["pending", "awaiting_payment", "new", "pending_payment_setup"].includes(initial),
    paidAt: null,
    pollError: null,
  }));
  const loggedFailRef = useRef(false);

  useEffect(() => {
    const next = coerceOrderStatus(initialStatus);
    setState((prev) => ({
      ...prev,
      status: next,
    }));
  }, [initialStatus, orderId]);

  useEffect(() => {
    let cancelled = false;
    loggedFailRef.current = false;

    const pollApi = async () => {
      try {
        const res = await fetch(
          `/api/dashboard/order-status?orderId=${encodeURIComponent(orderId)}&site=${encodeURIComponent(siteSlug)}`,
          { credentials: "include", cache: "no-store" },
        );
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            res.status === 403
              ? "Нет доступа к статусу заказа"
              : res.status === 404
                ? "Заказ не найден"
                : `Ошибка статуса (${res.status})`;
          if (!loggedFailRef.current) {
            loggedFailRef.current = true;
            console.warn("[useOrderLiveStatus]", siteSlug, orderId, msg);
          }
          setState((prev) => ({ ...prev, pollError: msg }));
          return;
        }
        const data = (await res.json()) as {
          effectiveStatus?: string;
          paidLike?: boolean;
          paid_at?: string | null;
        };
        if (data.effectiveStatus) {
          setState({
            status: coerceOrderStatus(data.effectiveStatus),
            paidLike: Boolean(data.paidLike),
            paidAt: data.paid_at ?? null,
            pollError: null,
          });
        }
      } catch {
        if (cancelled) return;
        if (!loggedFailRef.current) {
          loggedFailRef.current = true;
          console.warn("[useOrderLiveStatus] network", siteSlug, orderId);
        }
        setState((prev) => ({ ...prev, pollError: "Сеть: статус не обновлён" }));
      }
    };

    void pollApi();
    const apiTimer = window.setInterval(() => void pollApi(), API_POLL_MS);

    const supabase = siteSlug === "subs-store" ? tryCreateSubsBrowserClient() : createClient();
    if (!supabase) {
      return () => {
        cancelled = true;
        window.clearInterval(apiTimer);
      };
    }

    const channel = supabase
      .channel(`order-live-${siteSlug}-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => {
          void pollApi();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(apiTimer);
      void supabase.removeChannel(channel);
    };
  }, [orderId, siteSlug]);

  return state;
}
