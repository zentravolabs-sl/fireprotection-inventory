// ============================================================
// src/app/api/reports/weekly-stock/download/route.ts
// Returns the current weekly stock report data as JSON so
// the client can render and download it as a PDF.
//
// Authentication: Session-based via Better Auth.
// Authorization: SUPER_ADMIN or ADMIN only.
//
// Usage:
//   GET /api/reports/weekly-stock/download
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWeeklyStockReport } from "@/lib/services/weeklyStockReportService";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized — please sign in." }, { status: 401 });
  }

  const userRole = ((session.user as { role?: string }).role ?? "USER") as UserRole;

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden — only SUPER_ADMIN or ADMIN can download reports." },
      { status: 403 }
    );
  }

  // ── Generate report data ──────────────────────────────────
  try {
    const reportData = await getWeeklyStockReport();

    // Serialize Dates as ISO strings so JSON transport works cleanly
    return NextResponse.json({
      reportPeriod: {
        from: reportData.reportPeriod.from.toISOString(),
        to: reportData.reportPeriod.to.toISOString(),
      },
      summary: reportData.summary,
      stockMovementItems: reportData.stockMovementItems,
      topUsedItems: reportData.topUsedItems,
      lowStockItems: reportData.lowStockItems,
      outOfStockItems: reportData.outOfStockItems,
    });
  } catch (err) {
    console.error("[Weekly Report Download] Failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to generate report data. Check server logs." },
      { status: 500 }
    );
  }
}
