// ============================================================
// src/app/api/reports/weekly-stock/test/route.ts
// Admin-only manual test endpoint for the Weekly Stock Report.
//
// Authentication: Session-based via Better Auth.
// Authorization: Only SUPER_ADMIN or ADMIN roles are allowed.
//
// Usage:
//   GET /api/reports/weekly-stock/test
//   GET /api/reports/weekly-stock/test?preview=true  (returns HTML, no send)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWeeklyStockReport } from "@/lib/services/weeklyStockReportService";
import { sendWeeklyStockReportEmail } from "@/lib/email";
import { render } from "@react-email/components";
import WeeklyStockReportEmail, {
  buildEmailSubject,
} from "../../../../../../emails/WeeklyStockReportEmail";
import { logAuditEvent } from "@/lib/audit";
import type { UserRole } from "@/types/auth";
import * as React from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth check ────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized — please sign in." }, { status: 401 });
  }

  const userRole = ((session.user as { role?: string }).role ?? "USER") as UserRole;
  const userId = session.user.id;

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    await logAuditEvent("WEEKLY_STOCK_REPORT_TEST_FORBIDDEN", userId, {
      userRole,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json(
      { error: "Forbidden — only SUPER_ADMIN or ADMIN can trigger test reports." },
      { status: 403 }
    );
  }

  // ── Optional ?preview=true — return HTML without sending ─
  const preview = req.nextUrl.searchParams.get("preview") === "true";

  // ── Generate report data ──────────────────────────────────
  let reportData;
  try {
    reportData = await getWeeklyStockReport();
  } catch (err) {
    console.error("[Test Report] Data generation failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to generate report data. Check server logs." },
      { status: 500 }
    );
  }

  // ── Preview mode — return raw HTML ────────────────────────
  if (preview) {
    try {
      const emailElement = React.createElement(WeeklyStockReportEmail, {
        companyName: "CDN Fire Engineering",
        reportPeriod: reportData.reportPeriod,
        summary: reportData.summary,
        stockMovementItems: reportData.stockMovementItems,
        topUsedItems: reportData.topUsedItems,
        lowStockItems: reportData.lowStockItems,
        outOfStockItems: reportData.outOfStockItems,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? undefined,
      });
      const html = await render(emailElement);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (err) {
      console.error("[Test Report] Render failed:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Render failed" }, { status: 500 });
    }
  }

  // ── Send email ────────────────────────────────────────────
  let sentTo: string[] = [];
  try {
    const result = await sendWeeklyStockReportEmail(reportData);
    sentTo = result.sentTo;
  } catch (err) {
    console.error("[Test Report] Email send failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Email send failed. Check server logs." },
      { status: 500 }
    );
  }

  // ── Audit ─────────────────────────────────────────────────
  await logAuditEvent("WEEKLY_STOCK_REPORT_TEST_SENT", userId, {
    triggeredBy: session.user.email ?? userId,
    sentTo,
    reportPeriod: {
      from: reportData.reportPeriod.from.toISOString(),
      to: reportData.reportPeriod.to.toISOString(),
    },
    durationMs: Date.now() - startTime,
  });

  console.log(`[Test Report] Sent by ${session.user.email} to ${sentTo.join(", ")} in ${Date.now() - startTime}ms`);

  return NextResponse.json({
    success: true,
    message: `Test email sent successfully to: ${sentTo.join(", ")}`,
    sentTo,
    subject: buildEmailSubject(reportData.reportPeriod.from, reportData.reportPeriod.to),
    reportPeriod: {
      from: reportData.reportPeriod.from.toISOString(),
      to: reportData.reportPeriod.to.toISOString(),
    },
    summary: reportData.summary,
    durationMs: Date.now() - startTime,
  });
}
