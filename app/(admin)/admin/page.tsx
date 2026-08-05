import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { Metadata } from "next";

import { DashboardPeriodControls } from "@/components/admin/DashboardPeriodControls";
import {
  loadGptDashboardPeriodStats,
  loadSubsDashboardPeriodStats,
  type DashboardPeriodStats,
} from "@/lib/admin/dashboard-analytics";
import { resolveDashboardPeriod } from "@/lib/admin/dashboard-period";
import { getSiteUUID } from "@/lib/admin/getSiteId";
import { countAuthUsersForAdminSite } from "@/lib/admin/gpt-auth-user-metrics";
import { gptOrderStatusLabelRu } from "@/lib/admin/gpt-order-status-labels";
import { staffPanelRootFromPathname } from "@/lib/admin/notificationNavigation";
import { loadAdminOverviewStats, type AdminOverviewStats } from "@/lib/admin/revenue-stats";
import { resolveAdminSiteSlug } from "@/lib/admin/siteFilter";
import { staffNavHref } from "@/lib/admin/staffNavHref";
import { loadSubsStoreDashboardBlock } from "@/lib/admin/subs-store-dashboard";
import { subsOrderStatusLabelRu } from "@/lib/admin/subs-order-status-labels";
import { getSiteBySlug } from "@/lib/sites";
import { tryCreateAdminClient } from "@/lib/supabase/server";
import { createSubsStoreAdminClient } from "@/lib/supabase/subs-store-admin";

export const metadata: Metadata = { title: "Admin · Главная" };
export const dynamic = "force-dynamic";

function ordersHref(
  staffRoot: string,
  siteSlug: "gpt-store" | "subs-store",
  extra: Record<string, string | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v) q.set(k, v);
  }
  const path = `${staffRoot}/orders?${q.toString()}`;
  return staffNavHref(path, siteSlug);
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    site?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const siteSlug = resolveAdminSiteSlug(params);
  const site = getSiteBySlug(siteSlug);
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-pathname") ?? headersList.get("x-pathname") ?? "";
  const staffRoot = staffPanelRootFromPathname(pathname);
  const isOperatorPanel = staffRoot === "/operator";
  const reviewsHref = `${staffRoot}/reviews?status=pending&site=${siteSlug}`;
  const period = resolveDashboardPeriod({
    period: params.period,
    from: params.from,
    to: params.to,
  });

  let overview: AdminOverviewStats;
  let periodStats: DashboardPeriodStats | null = null;
  let totalOrders = 0;
  let pendingOrders = 0;
  let activeOrders = 0;
  let openChats = 0;
  let pendingReviews = 0;
  let totalClients = 0;
  let unreadClientMsgs = 0;
  let revenueFootnote = "";
  let statsLoadFailed = false;

  if (siteSlug === "subs-store") {
    const subsAdmin = createSubsStoreAdminClient();
    if (!subsAdmin) {
      return (
        <div className="p-6">
          <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900">Subs Store — данные</h1>
          <p className="max-w-xl text-sm text-gray-600">
            Добавьте <code className="rounded bg-gray-100 px-1">SUBS_SUPABASE_URL</code> и{" "}
            <code className="rounded bg-gray-100 px-1">SUBS_SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
        </div>
      );
    }
    const [m, analytics] = await Promise.all([
      loadSubsStoreDashboardBlock(subsAdmin),
      loadSubsDashboardPeriodStats(subsAdmin, period),
    ]);
    overview = m.overview;
    periodStats = analytics;
    totalOrders = m.totalOrders;
    pendingOrders = m.pendingOrders;
    activeOrders = m.activeOrders;
    openChats = m.openChats;
    pendingReviews = m.pendingReviews;
    totalClients = m.totalClients;
    unreadClientMsgs = m.unreadClientMsgs;
    revenueFootnote =
      "Оплачено / выручка: payment_status=paid, дата = paid_at (если пусто — created_at). Создано — по created_at. Часовой пояс Europe/Moscow.";
  } else {
    const admin = tryCreateAdminClient();
    if (!admin) {
      return (
        <div className="p-6">
          <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900">Панель администратора</h1>
          <p className="max-w-xl text-sm text-gray-600">
            Не настроен <code className="rounded bg-gray-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
        </div>
      );
    }
    const siteId = await getSiteUUID(siteSlug);
    const ordersBaseQ = admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("product", "ilike", "spotify%");
    const subsStoreId = await getSiteUUID("subs-store");

    let chatsBaseQ;
    if (subsStoreId) {
      chatsBaseQ = admin
        .from("chat_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .neq("site_id", subsStoreId);
    } else {
      chatsBaseQ = admin.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "open");
    }

    let reviewsBaseQ;
    if (siteId) {
      reviewsBaseQ = admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("site_id", siteId);
    } else {
      reviewsBaseQ = admin.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
    }

    let unreadClientMsgsQ;
    if (siteId) {
      const { data: siteSessionIds } = await admin.from("chat_sessions").select("id").eq("site_id", siteId);
      const ids = (siteSessionIds ?? []).map((s) => s.id);
      if (ids.length > 0) {
        unreadClientMsgsQ = admin
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_type", "client")
          .eq("is_read", false)
          .in("session_id", ids);
      }
    } else {
      unreadClientMsgsQ = admin
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_type", "client")
        .eq("is_read", false);
    }

    try {
      const [ov, analytics, totalRes, pendingRes, activeRes, chatsRes, reviewsRes, clientsCount, unreadRes] =
        await Promise.all([
          loadAdminOverviewStats(admin, new Date(), "gpt-store"),
          loadGptDashboardPeriodStats(admin, period),
          ordersBaseQ,
          admin
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .not("product", "ilike", "spotify%"),
          admin
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .not("product", "ilike", "spotify%"),
          chatsBaseQ,
          reviewsBaseQ,
          countAuthUsersForAdminSite(admin, "gpt-store"),
          unreadClientMsgsQ ?? Promise.resolve({ count: 0 }),
        ]);
      overview = ov;
      periodStats = analytics;
      totalOrders = totalRes.count ?? 0;
      pendingOrders = pendingRes.count ?? 0;
      activeOrders = activeRes.count ?? 0;
      openChats = chatsRes.count ?? 0;
      pendingReviews = reviewsRes.count ?? 0;
      totalClients = clientsCount;
      unreadClientMsgs = (unreadRes as { count?: number | null }).count ?? 0;
    } catch (err) {
      console.error("[admin/dashboard] GPT period stats failed", {
        message: err instanceof Error ? err.message : String(err),
        site: siteSlug,
        period: period.preset,
        from: period.fromIso,
        to: period.toIso,
      });
      // Keep analytics if only secondary counters failed: re-fetch period stats alone.
      try {
        periodStats = await loadGptDashboardPeriodStats(admin, period);
      } catch (statsErr) {
        console.error("[admin/dashboard] GPT analytics retry failed", {
          message: statsErr instanceof Error ? statsErr.message : String(statsErr),
        });
        periodStats = null;
      }
      overview = await loadAdminOverviewStats(admin, new Date(), "gpt-store");
      statsLoadFailed = true;
    }
    revenueFootnote =
      "Оплачено / выручка: статусы paid→active, дата = paid_at (если пусто — created_at). Создано — по created_at. Europe/Moscow.";
  }

  const accent =
    siteSlug === "subs-store"
      ? "bg-[#1DB954]/15 text-[#0d8f4a]"
      : "bg-[#10a37f]/10 text-[#0f7d62]";
  const revenueAccent = siteSlug === "subs-store" ? "text-[#1DB954]" : "text-[#10a37f]";
  const statusLabel = (s: string) =>
    siteSlug === "subs-store" ? subsOrderStatusLabelRu(s) : gptOrderStatusLabelRu(s);

  const periodQs = {
    from: period.fromYmd ?? undefined,
    to: period.toYmd ?? undefined,
  };

  const exportQs = new URLSearchParams({
    site: siteSlug,
    period: period.preset,
    format: "csv",
  });
  if (period.preset === "custom" && period.fromYmd && period.toYmd) {
    exportQs.set("from", period.fromYmd);
    exportQs.set("to", period.toYmd);
  }
  const exportCsvHref = `/api/admin/dashboard-export?${exportQs.toString()}`;
  const exportXlsxHref = `/api/admin/dashboard-export?${exportQs.toString().replace("format=csv", "format=xlsx")}`;

  const stat = (
    label: string,
    value: string | number,
    color: string,
    href?: string,
  ) => {
    const inner = (
      <>
        <p className={`font-heading text-2xl font-bold md:text-3xl ${color}`}>{value}</p>
        <p className="mt-1 text-xs text-gray-400">{label}</p>
      </>
    );
    if (!href) {
      return (
        <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
          {inner}
        </div>
      );
    }
    return (
      <Link
        key={label}
        href={href}
        className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900">
        {isOperatorPanel ? "Панель оператора" : "Панель администратора"}
        <span className="ml-3 text-base font-normal" style={{ color: site.primaryColor }}>
          {site.brandName}
        </span>
      </h1>

      <Suspense fallback={null}>
        <DashboardPeriodControls siteSlug={siteSlug} accentClass={accent} />
      </Suspense>

      {periodStats ? (
        <>
          <p className="mb-3 text-sm text-gray-600">
            Магазин: <span className="font-medium text-gray-900">{site.brandName}</span>
            {" · "}
            Период: <span className="font-medium text-gray-900">{period.label}</span>
            {" · "}
            Оплачено{" "}
            <span className="font-semibold text-gray-900">{periodStats.paid}</span> заказов на{" "}
            <span className="font-semibold text-gray-900">
              {periodStats.revenue.toLocaleString("ru")} ₽
            </span>
            {periodStats.byTariff[0] ? (
              <>
                . Топ тариф:{" "}
                <span className="font-medium text-gray-900">{periodStats.byTariff[0].label}</span>
              </>
            ) : null}
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            <a
              href={exportCsvHref}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Экспорт CSV
            </a>
            <a
              href={exportXlsxHref}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Экспорт XLSX
            </a>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Заказы за период
          </h2>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {stat(
              "Создано",
              periodStats.created,
              "text-gray-900",
              ordersHref(staffRoot, siteSlug, { ...periodQs }),
            )}
            {stat(
              "Оплачено",
              periodStats.paid,
              revenueAccent,
              ordersHref(staffRoot, siteSlug, { ...periodQs, paid: "1" }),
            )}
            {stat(
              "В работе",
              periodStats.inProgress,
              "text-sky-600",
              ordersHref(staffRoot, siteSlug, {
                ...periodQs,
                status: siteSlug === "subs-store" ? "processing" : "activating",
              }),
            )}
            {stat(
              "Отменено",
              periodStats.cancelled,
              "text-amber-600",
              ordersHref(staffRoot, siteSlug, {
                ...periodQs,
                status: siteSlug === "subs-store" ? "problem" : "failed",
              }),
            )}
            {stat(
              "Возвраты",
              periodStats.refunded,
              "text-red-600",
              ordersHref(staffRoot, siteSlug, {
                ...periodQs,
                status: siteSlug === "subs-store" ? "problem" : "refunded",
                paid: siteSlug === "subs-store" ? "refunded" : undefined,
              }),
            )}
            {stat("Выручка", `${periodStats.revenue.toLocaleString("ru")} ₽`, revenueAccent)}
            {stat("Средний чек", `${periodStats.avgCheck.toLocaleString("ru")} ₽`, "text-gray-900")}
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Тарифы
          </h2>
          <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2">Магазин</th>
                  <th className="px-3 py-2">Тариф</th>
                  <th className="px-3 py-2">Создано</th>
                  <th className="px-3 py-2">Оплачено</th>
                  <th className="px-3 py-2">Выручка</th>
                  <th className="px-3 py-2">Ср. чек</th>
                  <th className="px-3 py-2">Доля</th>
                  <th className="px-3 py-2">Отменено</th>
                  <th className="px-3 py-2">Возвраты</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodStats.byTariff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-gray-500">
                      Нет заказов за выбранный период.
                    </td>
                  </tr>
                ) : (
                  periodStats.byTariff.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-500">{site.brandName}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={ordersHref(staffRoot, siteSlug, {
                            ...periodQs,
                            plan: row.key,
                            paid: "1",
                          })}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {row.label}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{row.created}</td>
                      <td className="px-3 py-2 font-semibold">{row.paid}</td>
                      <td className="px-3 py-2">{row.revenue.toLocaleString("ru")} ₽</td>
                      <td className="px-3 py-2">{row.avgCheck.toLocaleString("ru")} ₽</td>
                      <td className="px-3 py-2">{row.paidShare}%</td>
                      <td className="px-3 py-2">{row.cancelled}</td>
                      <td className="px-3 py-2">{row.refunded}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Статусы (созданные за период)
          </h2>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {periodStats.byStatus.map((row) =>
              stat(
                statusLabel(row.status),
                row.count,
                "text-gray-800",
                ordersHref(staffRoot, siteSlug, { ...periodQs, status: row.status }),
              ),
            )}
          </div>
        </>
      ) : null}

      {statsLoadFailed ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Не удалось загрузить часть метрик.
        </div>
      ) : null}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Сегодня</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stat("Заказов сегодня", overview.ordersToday, "text-gray-900")}
        {stat("Выручка сегодня", `${overview.revenueToday.toLocaleString("ru")} ₽`, revenueAccent)}
        {stat("Новые клиенты", overview.newClientsToday, "text-blue-600")}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">В работе</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stat(
          siteSlug === "subs-store" ? "Зарегистрировано (Subs Auth)" : "Зарегистрировано (GPT Auth)",
          totalClients,
          "text-gray-900",
        )}
        {stat("Заказов всего", totalOrders, "text-gray-900")}
        {stat(
          "Ожидают оплаты",
          pendingOrders,
          "text-amber-500",
          ordersHref(staffRoot, siteSlug, {
            status: siteSlug === "subs-store" ? "awaiting_payment" : "awaiting_payment",
          }),
        )}
        {stat(
          "Активных подписок",
          activeOrders,
          revenueAccent,
          ordersHref(staffRoot, siteSlug, {
            status: siteSlug === "subs-store" ? "activated" : "active",
          }),
        )}
        {stat("Открытые чаты", openChats, "text-blue-500", `${staffRoot}/chat?site=${siteSlug}`)}
        {stat("Непрочитано от клиентов", unreadClientMsgs, "text-orange-500")}
        {stat("Отзывы на модерации", pendingReviews, "text-purple-500", reviewsHref)}
      </div>

      <p className="mt-6 text-xs text-gray-500">{revenueFootnote}</p>
    </div>
  );
}
