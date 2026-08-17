// ============================================================
// src/app/api/cron/weekly-stock-report/route.ts
// Scheduled cron endpoint — triggered every Friday at 6:00 PM IST.
//
// Protection: Bearer token in Authorization header must match
// CRON_SECRET environment variable.
//
// On Vercel: configured in vercel.json → crons.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getWeeklyStockReport } from "@/lib/services/weeklyStockReportService";
import { sendWeeklyStockReportEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Neon adapter requires Node.js runtime

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log("[Cron] Weekly Stock Report triggered at", new Date().toISOString());

  // ── Auth: Bearer token must match CRON_SECRET ─────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (providedToken !== cronSecret) {
    console.warn("[Cron] Unauthorized attempt — invalid Bearer token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Generate report ───────────────────────────────────────
  let reportData;
  try {
    reportData = await getWeeklyStockReport();
    console.log(
      `[Cron] Report generated in ${Date.now() - startTime}ms — ` +
        `stockIn=${reportData.summary.stockIn}, ` +
        `stockOut=${reportData.summary.stockOut}, ` +
        `lowStock=${reportData.summary.lowStockCount}`
    );
  } catch (err) {
    console.error("[Cron] Report generation failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 }
    );
  }

  // ── Send email ────────────────────────────────────────────
  let sentTo: string[] = [];
  try {
    const result = await sendWeeklyStockReportEmail(reportData);
    sentTo = result.sentTo;
    console.log(`[Cron] Email sent to: ${sentTo.join(", ")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron] Email send failed:", msg);

    await logAuditEvent("WEEKLY_STOCK_REPORT_EMAIL_FAILED", null, {
      error: msg,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Email send failed", detail: msg },
      { status: 500 }
    );
  }

  // ── Audit success ─────────────────────────────────────────
  await logAuditEvent("WEEKLY_STOCK_REPORT_EMAIL_SENT", null, {
    sentTo,
    reportPeriod: {
      from: reportData.reportPeriod.from.toISOString(),
      to: reportData.reportPeriod.to.toISOString(),
    },
    summary: reportData.summary,
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json({
    success: true,
    sentTo,
    reportPeriod: {
      from: reportData.reportPeriod.from.toISOString(),
      to: reportData.reportPeriod.to.toISOString(),
    },
    summary: reportData.summary,
    durationMs: Date.now() - startTime,
  });
}
