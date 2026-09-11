// ============================================================
// src/app/api/projects/[id]/material-issues-pdf/route.ts
// GET /api/projects/:id/material-issues-pdf?month=YYYY-MM
// Generates a Material Issue Report PDF for the given project
// scoped to a specific month (defaults to current month).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hRule(
  doc: jsPDF,
  y: number,
  lm: number,
  rEdge: number,
  color: [number, number, number] = [220, 220, 220]
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rEdge, y);
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user || (session.user as { isActive?: boolean }).isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse params ────────────────────────────────────────────────────────
  const { id } = await ctx.params;
  const projectId = Number(id);

  if (isNaN(projectId) || projectId <= 0) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // month param: YYYY-MM, defaults to current month
  const monthParam = req.nextUrl.searchParams.get("month");
  let startDate: Date;
  let endDate: Date;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1); // exclusive
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const monthLabel = startDate.toLocaleString("en-GB", { month: "long", year: "numeric" });

  // ── 3. Fetch project ───────────────────────────────────────────────────────
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      projectManager: { select: { name: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // ── 4. Fetch material issues in the month ──────────────────────────────────
  // We find MaterialIssue records linked to this project's MaterialRequests,
  // filtering by issueDate within the month window.
  const issues = await prisma.materialIssue.findMany({
    where: {
      issueDate: { gte: startDate, lt: endDate },
      materialRequest: { projectId },
    },
    include: {
      materialRequest: { select: { requestNo: true } },
      issuedByUser: { select: { name: true } },
      items: {
        include: {
          inventory: { select: { name: true, itemCode: true } },
          stockBatch: { select: { batchNo: true, unitCost: true } },
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { issueDate: "asc" },
  });

  // ── 5. Build PDF ───────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const LM = 14;
  const RM = 196;
  const CW = RM - LM;
  const RED: [number, number, number] = [185, 28, 28];
  const DARK: [number, number, number] = [30, 30, 30];
  const GRAY: [number, number, number] = [100, 100, 100];
  const LIGHT_GRAY: [number, number, number] = [240, 240, 240];
  const TABLE_LINE: [number, number, number] = [200, 200, 200];

  let pageNum = 1;
  let y = 14;

  // ── Page header (repeated) ─────────────────────────────────────────────────
  const drawPageHeader = (d: jsPDF) => {
    // Top red accent bar
    d.setFillColor(...RED);
    d.rect(LM, y, CW, 1.2, "F");
    y += 4;

    // Logo block
    d.setFillColor(...RED);
    d.roundedRect(LM, y, 12, 12, 2, 2, "F");
    d.setTextColor(255, 255, 255);
    d.setFontSize(8);
    d.setFont("helvetica", "bold");
    d.text("CDN", LM + 6, y + 5.5, { align: "center" });
    d.setFontSize(5.5);
    d.text("FIRE", LM + 6, y + 9, { align: "center" });

    // Company name
    d.setTextColor(...DARK);
    d.setFont("helvetica", "bold");
    d.setFontSize(14);
    d.text("CDN Fire Engineering", LM + 15, y + 5);
    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.setTextColor(...GRAY);
    d.text("Fire Protection & Safety Equipment Systems", LM + 15, y + 9.5);
    d.setFontSize(7);
    d.text("100 Industrial Parkway, Suite 400  |  Phone: +94 11 234 5678  |  sales@cdnfire.com", LM + 15, y + 13.5);

    // Right: report title
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(...RED);
    d.text("MATERIAL ISSUE REPORT", RM, y + 3, { align: "right" });
    d.setFontSize(8);
    d.setTextColor(...DARK);
    d.text(`Period: ${monthLabel}`, RM, y + 8.5, { align: "right" });
    d.setFontSize(7.5);
    d.setTextColor(...GRAY);
    d.setFont("helvetica", "normal");
    const genDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    d.text(`Generated: ${genDate}`, RM, y + 13.5, { align: "right" });

    y += 18;

    // Red separator
    d.setDrawColor(...RED);
    d.setLineWidth(0.6);
    d.line(LM, y, RM, y);
    y += 5;
  };

  // ── Page footer ────────────────────────────────────────────────────────────
  const drawPageFooter = (d: jsPDF, pNum: number) => {
    const footerY = PH - 10;
    d.setDrawColor(...TABLE_LINE);
    d.setLineWidth(0.3);
    d.line(LM, footerY - 2, RM, footerY - 2);
    d.setFont("helvetica", "normal");
    d.setFontSize(7);
    d.setTextColor(...GRAY);
    d.text("CDN Fire Engineering — Confidential Internal Document", LM, footerY);
    d.text(`Page ${pNum}`, RM, footerY, { align: "right" });
  };

  drawPageHeader(doc);

  // ── Project info box ───────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(LM, y, CW, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("PROJECT:", LM + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`${project.projectCode} — ${project.projectName}`, LM + 3, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(`Customer: ${project.customer.companyName}`, LM + 3, y + 15.5);
  doc.text(`Project Manager: ${project.projectManager?.name ?? "N/A"}`, LM + 3, y + 19.5);

  // Right side stats
  const totalIssueItems = issues.reduce((s, i) => s + i.items.length, 0);
  const totalQty = issues.reduce((s, i) => s + i.items.reduce((qs, it) => qs + it.qty, 0), 0);
  const totalValue = issues.reduce((s, i) => s + i.items.reduce((vs, it) => vs + it.qty * (it.stockBatch?.unitCost ?? 0), 0), 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("ISSUE COUNT:", RM - 3, y + 5, { align: "right" });
  doc.text("TOTAL ITEMS:", RM - 3, y + 10, { align: "right" });
  doc.text("TOTAL QTY:", RM - 3, y + 15, { align: "right" });
  doc.text("TOTAL VALUE:", RM - 3, y + 20, { align: "right" });

  doc.setTextColor(...DARK);
  doc.text(String(issues.length), RM, y + 5, { align: "right" });
  doc.text(String(totalIssueItems), RM, y + 10, { align: "right" });
  doc.text(String(totalQty.toFixed(2)), RM, y + 15, { align: "right" });
  doc.text(`LKR ${totalValue.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, RM, y + 20, { align: "right" });

  y += 26;

  if (issues.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(`No material issues recorded for ${monthLabel}.`, PW / 2, y + 20, { align: "center" });
    drawPageFooter(doc, pageNum);
  } else {
    // ── Per-issue sections ───────────────────────────────────────────────────
    // Table column widths
    const COL_NO = 8;
    const COL_CODE = 30;
    const COL_NAME = 70;
    const COL_BATCH = 32;
    const COL_QTY = 18;
    const COL_COST = 22;
    const COL_TOTAL = CW - COL_NO - COL_CODE - COL_NAME - COL_BATCH - COL_QTY - COL_COST;
    const ROW_H = 7;

    const drawTableHeader = (d: jsPDF) => {
      d.setFillColor(...RED);
      d.rect(LM, y, CW, ROW_H, "F");
      d.setFont("helvetica", "bold");
      d.setFontSize(6.5);
      d.setTextColor(255, 255, 255);
      let cx = LM + 2;
      d.text("#", cx + COL_NO / 2, y + ROW_H - 2, { align: "center" }); cx += COL_NO;
      d.text("ITEM CODE", cx + 2, y + ROW_H - 2); cx += COL_CODE;
      d.text("MATERIAL NAME", cx + 2, y + ROW_H - 2); cx += COL_NAME;
      d.text("BATCH NO.", cx + 2, y + ROW_H - 2); cx += COL_BATCH;
      d.text("QTY", cx + 2, y + ROW_H - 2); cx += COL_QTY;
      d.text("UNIT COST", cx + 2, y + ROW_H - 2); cx += COL_COST;
      d.text("TOTAL", cx + 2, y + ROW_H - 2);
      y += ROW_H;
    };

    for (const issue of issues) {
      // Section header for each issue
      if (y > PH - 60) {
        drawPageFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        y = 14;
        drawPageHeader(doc);
      }

      const issueDate = new Date(issue.issueDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });

      // Issue header row
      doc.setFillColor(245, 245, 245);
      doc.rect(LM, y, CW, 8, "F");
      doc.setDrawColor(...TABLE_LINE);
      doc.setLineWidth(0.3);
      doc.rect(LM, y, CW, 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(`Issue No: ${issue.issueNo}`, LM + 3, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(`Request: ${issue.materialRequest?.requestNo ?? "—"}`, LM + 60, y + 5.5);
      doc.text(`Date: ${issueDate}`, LM + 110, y + 5.5);
      doc.text(`Issued By: ${issue.issuedByUser?.name ?? "System"}`, LM + 150, y + 5.5);

      y += 10;

      // Draw table header
      drawTableHeader(doc);

      // Issue line items
      let issueSubtotal = 0;
      issue.items.forEach((item, idx) => {
        if (y > PH - 30) {
          drawPageFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          y = 14;
          drawPageHeader(doc);
          drawTableHeader(doc);
        }

        const lineTotal = item.qty * (item.stockBatch?.unitCost ?? 0);
        issueSubtotal += lineTotal;

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(LM, y, CW, ROW_H, "F");
        }

        doc.setDrawColor(...TABLE_LINE);
        doc.setLineWidth(0.2);
        doc.rect(LM, y, CW, ROW_H);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...DARK);

        let cx = LM + 2;
        doc.text(String(idx + 1), cx + COL_NO / 2, y + ROW_H - 2, { align: "center" }); cx += COL_NO;
        doc.setFont("helvetica", "bold");
        doc.text(item.inventory.itemCode, cx + 2, y + ROW_H - 2); cx += COL_CODE;
        doc.setFont("helvetica", "normal");
        const nameFit = doc.splitTextToSize(item.inventory.name, COL_NAME - 4) as string[];
        doc.text(nameFit[0] ?? "", cx + 2, y + ROW_H - 2); cx += COL_NAME;
        doc.setTextColor(...GRAY);
        doc.text(item.stockBatch?.batchNo ?? "—", cx + 2, y + ROW_H - 2); cx += COL_BATCH;
        doc.setTextColor(...DARK);
        doc.text(String(item.qty), cx + 2, y + ROW_H - 2); cx += COL_QTY;
        doc.setTextColor(...GRAY);
        doc.text(`LKR ${(item.stockBatch?.unitCost ?? 0).toFixed(2)}`, cx + 2, y + ROW_H - 2); cx += COL_COST;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...DARK);
        doc.text(`LKR ${lineTotal.toFixed(2)}`, cx + 2, y + ROW_H - 2);

        y += ROW_H;
      });

      // Subtotal row
      doc.setFillColor(...LIGHT_GRAY);
      doc.rect(LM, y, CW, ROW_H, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK);
      doc.text("ISSUE SUBTOTAL:", RM - COL_TOTAL - 4, y + ROW_H - 2, { align: "right" });
      doc.setTextColor(...RED);
      doc.text(`LKR ${issueSubtotal.toFixed(2)}`, RM - 2, y + ROW_H - 2, { align: "right" });
      y += ROW_H + 6;
    }

    // ── Grand total ────────────────────────────────────────────────────────
    if (y > PH - 30) {
      drawPageFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = 14;
      drawPageHeader(doc);
    }

    hRule(doc, y, LM, RM, RED);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text("GRAND TOTAL:", LM, y);
    doc.setTextColor(...RED);
    doc.text(
      `LKR ${totalValue.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      RM,
      y,
      { align: "right" }
    );

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `${issues.length} issue document(s) | ${totalIssueItems} line item(s) | Total Qty: ${totalQty.toFixed(2)}`,
      LM,
      y
    );

    drawPageFooter(doc, pageNum);
  }

  // ── 6. Return PDF ──────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const safeProject = project.projectCode.replace(/[^a-zA-Z0-9\-_]/g, "-");
  const safeMonth = startDate.toISOString().slice(0, 7);
  const filename = `Material-Issues-${safeProject}-${safeMonth}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
