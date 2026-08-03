import { NextRequest, NextResponse } from "next/server";

import {
  loadGptDashboardPeriodStats,
  loadSubsDashboardPeriodStats,
} from "@/lib/admin/dashboard-analytics";
import { resolveDashboardPeriod } from "@/lib/admin/dashboard-period";
import { fetchGptOrdersForAdmin } from "@/lib/admin/gpt-orders-fetch";
import { requireStaffApi } from "@/lib/admin/require-staff-api";
import { resolveAdminSiteSlug } from "@/lib/admin/siteFilter";
import { fetchSubsOrdersForAdmin } from "@/lib/admin/subs-orders-fetch";
import { createSubsStoreAdminClient } from "@/lib/supabase/subs-store-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { getSiteBySlug } from "@/lib/sites";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function xmlEscape(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCsv(rows: string[][]): string {
  const bom = "\uFEFF";
  return bom + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

/** Excel-compatible SpreadsheetML (opens in Excel / LibreOffice). */
function buildSpreadsheetMl(rows: string[][]): string {
  const sheetRows = rows
    .map(
      (r) =>
        `<Row>${r
          .map((c) => `<Cell><Data ss:Type="String">${xmlEscape(c)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="orders">
  <Table>${sheetRows}</Table>
 </Worksheet>
</Workbook>`;
}

export async function GET(req: NextRequest) {
  const ctx = await requireStaffApi();
  if (ctx instanceof NextResponse) return ctx;

  const siteSlug = resolveAdminSiteSlug({
    site: req.nextUrl.searchParams.get("site") ?? undefined,
  });
  const format = (req.nextUrl.searchParams.get("format") || "csv").toLowerCase();
  const period = resolveDashboardPeriod({
    period: req.nextUrl.searchParams.get("period"),
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });
  const site = getSiteBySlug(siteSlug);
  const fromLabel = period.fromYmd ?? "all";
  const toLabel = period.toYmd ?? "all";
  const baseName = `orders_${fromLabel}_${toLabel}_${siteSlug === "subs-store" ? "spotify" : "gpt"}`;

  const header = [
    "order_id",
    "store",
    "created_at",
    "paid_at",
    "client",
    "account_email",
    "tariff",
    "amount",
    "order_status",
    "payment_status",
  ];

  let dataRows: string[][] = [];

  if (siteSlug === "subs-store") {
    const subs = createSubsStoreAdminClient();
    if (!subs) {
      return NextResponse.json({ error: "Subs Store не подключён" }, { status: 503 });
    }
    const [{ orders }, stats] = await Promise.all([
      fetchSubsOrdersForAdmin(subs, {
        offset: 0,
        limit: 5000,
        fromIso: period.fromIso,
        toIso: period.toIso,
      }),
      loadSubsDashboardPeriodStats(subs, period),
    ]);
    dataRows = orders.map((o) => [
      o.id,
      site.brandName,
      o.created_at,
      o.paid_at ?? "",
      o.profileEmail ?? o.customer_email ?? "",
      o.customer_email ?? "",
      o.tariffTitle,
      String(o.final_price ?? 0),
      o.status,
      o.payment_status,
    ]);
    void stats;
  } else {
    const admin = createAdminClient();
    const [{ orders }, stats] = await Promise.all([
      fetchGptOrdersForAdmin(admin, {
        offset: 0,
        limit: 5000,
        fromIso: period.fromIso,
        toIso: period.toIso,
      }),
      loadGptDashboardPeriodStats(admin, period),
    ]);
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))] as string[];
    const emailByUser = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await admin.from("profiles").select("id, email").in("id", userIds);
      for (const p of profiles ?? []) {
        if (p.id) emailByUser.set(p.id, p.email ?? "");
      }
    }
    dataRows = orders.map((o) => [
      o.id,
      site.brandName,
      o.created_at,
      (o as { paid_at?: string | null }).paid_at ?? "",
      (o.user_id && emailByUser.get(o.user_id)) || "",
      o.account_email ?? "",
      o.plan_id,
      String(o.price ?? 0),
      o.status,
      "",
    ]);
    void stats;
  }

  const rows = [header, ...dataRows];

  if (format === "xlsx" || format === "xls") {
    const body = buildSpreadsheetMl(rows);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.xls"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const body = buildCsv(rows);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
