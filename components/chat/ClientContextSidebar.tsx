"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ChatRoomListItem } from "@/types/chat-ui";
import { Check, Copy, Loader2, MessageCircle, ShoppingBag } from "lucide-react";

import { StaffOrderStatusSelect } from "@/components/admin/StaffOrderStatusSelect";
import { gptOrderStatusLabelRu } from "@/lib/admin/gpt-order-status-labels";
import { subsOrderStatusLabelRu } from "@/lib/admin/subs-order-status-labels";
import { buildOrdersClientParam } from "@/lib/admin/orders-client-filter";
import { staffNavHref } from "@/lib/admin/staffNavHref";
import { createClient } from "@/lib/supabase/client";
import { tryCreateSubsBrowserClient } from "@/lib/supabase/subs-browser-client";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  plan_id: string;
  price: number;
  created_at: string;
  payment_status?: string | null;
  paid_at?: string | null;
  plan_title?: string;
};

type Summary = {
  profile: {
    id: string;
    email: string | null;
    username: string | null;
    telegram_id: number | null;
    telegram_username: string | null;
    created_at: string;
    last_seen: string | null;
    notes: string | null;
    tags: string[];
    client_stage: string | null;
    role: string;
  } | null;
  site_slug?: "gpt-store" | "subs-store";
  effective_stage: string;
  has_active_subscription: boolean;
  focus_order: OrderRow | null;
  active_order: OrderRow | null;
  orders: OrderRow[];
  hint?: string;
};

const STAGE_LABEL: Record<string, string> = {
  purchased: "Купил",
  waiting: "В ожидании",
  no_purchase: "Не покупал",
  needs_help: "Нужна помощь",
  other: "Другое",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Не оплачен",
  paid: "Оплачен",
  refunded: "Возврат",
  failed: "Ошибка оплаты",
};

interface Props {
  room: ChatRoomListItem | null;
  staffBasePath: string;
  siteSlug?: "gpt-store" | "subs-store";
  /** Заказ из URL (?order_id=) — подсветить в карточке. */
  highlightOrderId?: string | null;
}

function statusLabel(siteSlug: "gpt-store" | "subs-store", status: string): string {
  return siteSlug === "subs-store" ? subsOrderStatusLabelRu(status) : gptOrderStatusLabelRu(status);
}

function paymentLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return PAYMENT_STATUS_LABEL[value] ?? value;
}

function formatRuDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderIdCopy({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order ID</p>
      <div className="mt-0.5 flex items-start gap-1.5">
        <p className="min-w-0 flex-1 break-all font-mono text-[11px] leading-snug text-gray-800">
          {orderId}
        </p>
        <button
          type="button"
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]/40"
          title="Скопировать order_id"
          aria-label="Скопировать order_id"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void navigator.clipboard.writeText(orderId).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check size={12} className="text-[#10a37f]" /> : <Copy size={12} />}
        </button>
      </div>
      {copied ? <p className="mt-0.5 text-[10px] text-[#10a37f]">Скопировано</p> : null}
    </div>
  );
}

export function ClientContextSidebar({
  room,
  staffBasePath,
  siteSlug = "gpt-store",
  highlightOrderId = null,
}: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preferredOrderId, setPreferredOrderId] = useState<string | null>(null);
  const lastRefreshRef = useRef(0);
  const fetchGenRef = useRef(0);

  const effectiveOrderId = preferredOrderId || highlightOrderId;

  const loadSummary = useCallback(
    async (opts?: { silent?: boolean; orderIdOverride?: string | null }) => {
      if (!room?.client_id) {
        setData(null);
        return;
      }
      const gen = ++fetchGenRef.current;
      if (!opts?.silent) {
        setLoading(true);
        setErr(null);
      }
      try {
        const orderFromClient = room.client_id.startsWith("order:")
          ? room.client_id.slice("order:".length)
          : "";
        const isSyntheticClient =
          room.client_id.startsWith("email:") || room.client_id.startsWith("order:");
        const params = new URLSearchParams({
          email: room.client?.email ?? "",
          sessionId: room.id ?? "",
          site: siteSlug,
        });
        if (!isSyntheticClient) params.set("userId", room.client_id);
        const orderId =
          opts && "orderIdOverride" in opts
            ? opts.orderIdOverride
            : preferredOrderId || highlightOrderId || orderFromClient;
        if (orderId) params.set("orderId", orderId);
        const res = await fetch(`/api/staff/client-summary?${params.toString()}`, {
          credentials: "include",
        });
        const json = (await res.json()) as Summary & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Не удалось загрузить");
        if (gen === fetchGenRef.current) setData(json);
      } catch (e) {
        if (gen === fetchGenRef.current && !opts?.silent) {
          setData(null);
          setErr(e instanceof Error ? e.message : "Ошибка");
        }
      } finally {
        if (gen === fetchGenRef.current && !opts?.silent) setLoading(false);
      }
    },
    [room?.client_id, room?.client?.email, room?.id, siteSlug, highlightOrderId, preferredOrderId],
  );

  useEffect(() => {
    setPreferredOrderId(null);
  }, [room?.client_id]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!room?.client_id) return;
    const supabase =
      siteSlug === "subs-store" ? tryCreateSubsBrowserClient() : createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`staff-client-card-${siteSlug}-${room.client_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          const now = Date.now();
          if (now - lastRefreshRef.current < 1200) return;
          lastRefreshRef.current = now;
          void loadSummary({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.client_id, siteSlug, loadSummary]);

  const resolvedSite = data?.site_slug ?? siteSlug;
  const focusOrder = data?.focus_order ?? data?.active_order ?? null;
  const otherOrders = (data?.orders ?? []).filter((o) => o.id !== focusOrder?.id).slice(0, 5);
  const focusIsPreferred = Boolean(
    focusOrder && effectiveOrderId && focusOrder.id === effectiveOrderId,
  );

  if (!room) {
    return (
      <div className="hidden w-72 flex-shrink-0 border-l border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-500 xl:block">
        Выберите клиента
      </div>
    );
  }

  const clientParam = buildOrdersClientParam({
    clientId: room.client_id,
    profileId: data?.profile?.id,
    email: data?.profile?.email ?? room.client?.email,
  });
  const ordersHref = clientParam
    ? staffNavHref(
        `${staffBasePath}/orders?client=${encodeURIComponent(clientParam)}`,
        resolvedSite,
      )
    : staffNavHref(`${staffBasePath}/orders`, resolvedSite);
  const clientsHref = staffNavHref(
    `${staffBasePath.replace(/\/$/, "")}/clients?highlight=${encodeURIComponent(room.client_id)}`,
    resolvedSite,
  );
  const openOrderHref = focusOrder
    ? clientParam
      ? staffNavHref(
          `${staffBasePath}/orders?client=${encodeURIComponent(clientParam)}&highlight=${encodeURIComponent(focusOrder.id)}`,
          resolvedSite,
        )
      : `${staffNavHref(`${staffBasePath}/orders`, resolvedSite)}&highlight=${encodeURIComponent(focusOrder.id)}`
    : ordersHref;

  return (
    <aside className="hidden w-80 flex-shrink-0 flex-col border-l border-gray-100 bg-gray-50/90 xl:flex">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Карточка клиента</p>
        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
          {room.client?.full_name ?? room.client?.email ?? "Клиент"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </div>
        )}
        {err && <p className="text-red-600">{err}</p>}
        {!loading && !err && data && (
          <div className="space-y-4">
            {data.profile ? (
              <>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="break-all text-gray-900">{data.profile.email ?? room.client?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Имя</p>
                  <p className="text-gray-900">{data.profile.username ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Telegram</p>
                  <p className="text-gray-900">
                    {data.profile.telegram_username ? `@${data.profile.telegram_username}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Этап</p>
                  <p className="font-medium text-gray-900">
                    {STAGE_LABEL[data.effective_stage] ?? data.effective_stage}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Подписка</p>
                  <p className="text-gray-900">
                    {data.has_active_subscription ? "Есть активная" : "Нет активной"}
                  </p>
                </div>
                {focusOrder ? (
                  <div
                    className={cn(
                      "rounded-xl border bg-white p-3",
                      focusIsPreferred
                        ? "border-[#10a37f] ring-2 ring-[#10a37f]/25"
                        : "border-gray-200",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {focusIsPreferred ? "Выбранный заказ" : "Последний заказ"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {focusOrder.plan_title || focusOrder.plan_id} ·{" "}
                      {focusOrder.price.toLocaleString("ru")} ₽
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Создан: {formatRuDateTime(focusOrder.created_at)}
                    </p>
                    <OrderIdCopy orderId={focusOrder.id} />
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-gray-900">
                        <span className="text-gray-400">Статус заказа: </span>
                        {statusLabel(resolvedSite, focusOrder.status)}
                      </p>
                      {paymentLabel(focusOrder.payment_status) ? (
                        <p className="text-xs text-gray-900">
                          <span className="text-gray-400">Статус оплаты: </span>
                          {paymentLabel(focusOrder.payment_status)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Сменить статус
                      </p>
                      <StaffOrderStatusSelect
                        orderId={focusOrder.id}
                        initialStatus={focusOrder.status}
                        siteSlug={resolvedSite}
                        onStatusChange={() => {
                          void loadSummary({ silent: true });
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={openOrderHref}
                        className="inline-flex items-center rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]/40"
                      >
                        Открыть заказ
                      </Link>
                      {preferredOrderId ? (
                        <button
                          type="button"
                          className="text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:underline"
                          onClick={() => {
                            setPreferredOrderId(null);
                            void loadSummary({ silent: true, orderIdOverride: null });
                          }}
                        >
                          К последнему заказу
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {otherOrders.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-400">Другие заказы клиента</p>
                    <ul className="mt-1 space-y-1.5">
                      {otherOrders.map((o) => (
                        <li key={o.id} className="rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs">
                          <p className="font-medium text-gray-800">
                            {(o.plan_title || o.plan_id)} · {o.price.toLocaleString("ru")} ₽
                          </p>
                          <p className="text-gray-500">{statusLabel(resolvedSite, o.status)}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {formatRuDateTime(o.created_at)}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-[10px] text-gray-500">{o.id}</p>
                          <button
                            type="button"
                            className="mt-1 text-[11px] font-medium text-[#10a37f] hover:underline"
                            onClick={() => {
                              setPreferredOrderId(o.id);
                              void loadSummary({ silent: true, orderIdOverride: o.id });
                            }}
                          >
                            Показать этот заказ
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-gray-400">Заказов всего</p>
                  <p className="text-gray-900">{data.orders.length}</p>
                </div>
                {data.profile.notes ? (
                  <div>
                    <p className="text-xs text-gray-400">Заметка</p>
                    <p className="whitespace-pre-wrap text-gray-700">{data.profile.notes}</p>
                  </div>
                ) : null}
              </>
            ) : null}
            {clientParam ? (
              <Link
                href={ordersHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]/40"
              >
                <ShoppingBag size={14} />
                Все заказы клиента
              </Link>
            ) : (
              <p
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                role="status"
              >
                Не удалось определить клиента для фильтра заказов. Откройте диалог с профилем или
                email.
              </p>
            )}
            <Link
              href={clientsHref}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10a37f]/40"
            >
              <MessageCircle size={14} />
              Полная карточка
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
