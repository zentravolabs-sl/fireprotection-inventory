// ============================================================
// src/app/api/customer-refills/[id]/pdf/route.ts
// Secure server-side Customer Refill Delivery Note PDF generation.
// GET /api/customer-refills/:id/pdf
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { jsPDF } from "jspdf";

export const dynamic = "force-dynamic";

function hRule(doc: jsPDF, y: number, lm: number, rEdge: number, color: [number, number, number] = [220, 220, 220]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rEdge, y);
}

function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line: string, i: number) => {
    doc.text(line, x, y + i * lineHeight);
  });
  return lines.length * lineHeight;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth check ────────────────────────────────────────────────────────────
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user || (session.user as { isActive?: boolean }).isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Permission check ──────────────────────────────────────────────────────
  const permissions = await getCurrentUserPermissions();
  const userRole = (session.user as { role?: string }).role ?? "USER";
  const canView =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    permissions.has("customerRefills.view");

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. Parse ID ──────────────────────────────────────────────────────────────
  const { id } = await ctx.params;
  const refillId = Number(id);

  if (isNaN(refillId) || refillId <= 0) {
    return NextResponse.json({ error: "Invalid refill ID" }, { status: 400 });
  }

  // ── 4. Fetch data ────────────────────────────────────────────────────────────
  const refill = await prisma.customerRefill.findUnique({
    where: { id: refillId },
    include: {
      customer: true,
      items: { orderBy: { id: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!refill) {
    return NextResponse.json({ error: "Customer Refill not found" }, { status: 404 });
  }

  // ── 5. Generate PDF ──────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const LM = 14;
  const RM = 196;
  const CW = RM - LM;
  const RED: [number, number, number] = [185, 28, 28]; // Primary Red Theme
  const DARK: [number, number, number] = [30, 30, 30];
  const GRAY: [number, number, number] = [100, 100, 100];
  const LIGHT_GRAY: [number, number, number] = [240, 240, 240];
  const TABLE_LINE: [number, number, number] = [200, 200, 200];

  let pageNum = 1;
  let y = 14;

  const fmtDate = (d: Date | string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Header drawer
  const drawPageHeader = (d: jsPDF) => {
    // Red top bar
    d.setFillColor(...RED);
    d.rect(LM, y, CW, 1.2, "F");

    y += 4;

    // Company logo block
    d.setFillColor(...RED);
    d.roundedRect(LM, y, 12, 12, 2, 2, "F");
    d.setTextColor(255, 255, 255);
    d.setFontSize(8);
    d.setFont("helvetica", "bold");
    d.text("CDN", LM + 6, y + 5.5, { align: "center" });
    d.setFontSize(5.5);
    d.text("FIRE", LM + 6, y + 9, { align: "center" });

    // Company Name
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

    // Document label
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(...RED);
    d.text("REFILL DELIVERY NOTE", RM, y + 3, { align: "right" });

    d.setFontSize(9);
    d.setTextColor(...DARK);
    d.text(`No: ${refill.refillNo}`, RM, y + 8.5, { align: "right" });

    d.setFontSize(8);
    d.setTextColor(...GRAY);
    d.setFont("helvetica", "normal");
    d.text(`Returned: ${fmtDate(refill.completedDate)}`, RM, y + 13.5, { align: "right" });

    y += 18;

    // Red divider
    d.setDrawColor(...RED);
    d.setLineWidth(0.6);
    d.line(LM, y, RM, y);
    y += 5;
  };

  // Footer drawer
  const drawPageFooter = (d: jsPDF, pNum: number) => {
    const footerY = PH - 10;
    d.setDrawColor(...TABLE_LINE);
    d.setLineWidth(0.3);
    d.line(LM, footerY - 2, RM, footerY - 2);
    d.setFont("helvetica", "normal");
    d.setFontSize(7);
    d.setTextColor(...GRAY);
    d.text("All fire extinguishers are inspected, serviced, and refilled prior to return.", LM, footerY);
    d.text(`Page ${pNum}`, RM, footerY, { align: "right" });
  };

  // Draw Page 1 Header
  drawPageHeader(doc);

  // Info boxes
  const boxTop = y;
  const halfCW = CW / 2 - 3;

  // Left box - Customer
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(LM, boxTop, halfCW, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("RETURN TO CUSTOMER:", LM + 3, boxTop + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(refill.customer.companyName, LM + 3, boxTop + 10);

  let leftY = boxTop + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  if (refill.customer.contactPerson) {
    doc.text(`Attn: ${refill.customer.contactPerson}`, LM + 3, leftY);
    leftY += 4;
  }
  if (refill.customer.phone) {
    doc.text(`Phone: ${refill.customer.phone}`, LM + 3, leftY);
    leftY += 4;
  }
  if (refill.customer.email) {
    doc.text(`Email: ${refill.customer.email}`, LM + 3, leftY);
  }

  // Right box - Job info
  const rxStart = LM + halfCW + 6;
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(rxStart, boxTop, halfCW, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("JOB DETAILS:", rxStart + 3, boxTop + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`Refill No: ${refill.refillNo}`, rxStart + 3, boxTop + 10);
  doc.text(`Received Date: ${fmtDate(refill.receivedDate)}`, rxStart + 3, boxTop + 14);
  doc.text(`Prepared By: ${refill.createdBy?.name || "—"}`, rxStart + 3, boxTop + 18);
  if (refill.customer.address) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(7.5);
    wrappedText(doc, refill.customer.address, rxStart + 3, boxTop + 22, halfCW - 6, 3.5);
  }

  y = boxTop + 32;

  if (refill.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text("NOTES:", LM, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const noteLines = doc.splitTextToSize(refill.notes, CW) as string[];
    noteLines.forEach((line: string) => {
      doc.text(line, LM, y);
      y += 4;
    });
    y += 2;
  }

  // Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(`REFILLED FIRE EXTINGUISHER UNITS (${refill.items.length} Line Item${refill.items.length !== 1 ? "s" : ""})`, LM, y);
  y += 3;

  const COL_NO = 8;
  const COL_TYPE = 64;
  const COL_CAP = 22;
  const COL_QTY_REC = 20;
  const COL_QTY_RET = 20;
  const COL_REFILL = 24;
  const COL_EXPIRE = CW - COL_NO - COL_TYPE - COL_CAP - COL_QTY_REC - COL_QTY_RET - COL_REFILL;

  const ROW_H = 7;

  // Header row
  doc.setFillColor(...RED);
  doc.rect(LM, y, CW, ROW_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);

  let cx = LM + 2;
  doc.text("#", cx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
  cx += COL_NO;
  doc.text("EXTINGUISHER TYPE", cx + 2, y + ROW_H - 2);
  cx += COL_TYPE;
  doc.text("CAPACITY", cx + COL_CAP / 2, y + ROW_H - 2, { align: "center" });
  cx += COL_CAP;
  doc.text("QTY REC.", cx + COL_QTY_REC / 2, y + ROW_H - 2, { align: "center" });
  cx += COL_QTY_REC;
  doc.text("QTY RET.", cx + COL_QTY_RET / 2, y + ROW_H - 2, { align: "center" });
  cx += COL_QTY_RET;
  doc.text("REFILL DATE", cx + 2, y + ROW_H - 2);
  cx += COL_REFILL;
  doc.text("EXPIRE DATE", cx + 2, y + ROW_H - 2);

  y += ROW_H;

  // Table body
  let totalRec = 0;
  let totalRet = 0;

  refill.items.forEach((item, index) => {
    totalRec += item.receivedQty;
    totalRet += item.returnedQty;

    if (y > PH - 65) {
      drawPageFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = 14;
      drawPageHeader(doc);

      doc.setFillColor(...RED);
      doc.rect(LM, y, CW, ROW_H, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      let hcx = LM + 2;
      doc.text("#", hcx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
      hcx += COL_NO;
      doc.text("EXTINGUISHER TYPE (CONT.)", hcx + 2, y + ROW_H - 2);
      hcx += COL_TYPE;
      doc.text("CAPACITY", hcx + COL_CAP / 2, y + ROW_H - 2, { align: "center" });
      hcx += COL_CAP;
      doc.text("QTY REC.", hcx + COL_QTY_REC / 2, y + ROW_H - 2, { align: "center" });
      hcx += COL_QTY_REC;
      doc.text("QTY RET.", hcx + COL_QTY_RET / 2, y + ROW_H - 2, { align: "center" });
      hcx += COL_QTY_RET;
      doc.text("REFILL DATE", hcx + 2, y + ROW_H - 2);
      hcx += COL_REFILL;
      doc.text("EXPIRE DATE", hcx + 2, y + ROW_H - 2);
      y += ROW_H;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(LM, y, CW, ROW_H, "F");
    }

    doc.setDrawColor(...TABLE_LINE);
    doc.setLineWidth(0.2);
    doc.rect(LM, y, CW, ROW_H);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);

    let rcx = LM + 2;
    doc.text(String(index + 1), rcx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
    rcx += COL_NO;
    doc.setFont("helvetica", "bold");
    doc.text(item.extinguisherType, rcx + 2, y + ROW_H - 2);
    rcx += COL_TYPE;
    doc.setFont("helvetica", "normal");
    doc.text(item.capacity || "—", rcx + COL_CAP / 2, y + ROW_H - 2, { align: "center" });
    rcx += COL_CAP;
    doc.text(String(item.receivedQty), rcx + COL_QTY_REC / 2, y + ROW_H - 2, { align: "center" });
    rcx += COL_QTY_REC;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 122, 85); // Emerald for returned
    doc.text(String(item.returnedQty), rcx + COL_QTY_RET / 2, y + ROW_H - 2, { align: "center" });
    rcx += COL_QTY_RET;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(fmtDate(item.refillDate), rcx + 2, y + ROW_H - 2);
    rcx += COL_REFILL;
    doc.setTextColor(180, 80, 0); // Amber for expire
    doc.setFont("helvetica", "bold");
    doc.text(fmtDate(item.expireDate), rcx + 2, y + ROW_H - 2);

    y += ROW_H;
  });

  // Total row
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(LM, y, CW, ROW_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("TOTAL:", LM + COL_NO + COL_TYPE + COL_CAP - 6, y + ROW_H - 2);
  doc.text(String(totalRec), LM + COL_NO + COL_TYPE + COL_CAP + COL_QTY_REC / 2, y + ROW_H - 2, { align: "center" });
  doc.setTextColor(5, 122, 85);
  doc.text(String(totalRet), LM + COL_NO + COL_TYPE + COL_CAP + COL_QTY_REC + COL_QTY_RET / 2, y + ROW_H - 2, { align: "center" });
  y += ROW_H + 8;

  // Signatures
  if (y > PH - 68) {
    drawPageFooter(doc, pageNum);
    doc.addPage();
    pageNum++;
    y = 20;
    drawPageHeader(doc);
  }

  hRule(doc, y, LM, RM, [180, 180, 180]);
  y += 6;

  const sigColW = (CW - 10) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("RETURNED BY:", LM, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("CDN Fire Engineering", LM, y + 5);

  const rxSig = LM + sigColW + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("RECEIVED IN GOOD CONDITION BY:", rxSig, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(refill.customer.companyName, rxSig, y + 5);

  y += 14;

  const labelFont = 7.5;
  const lineGap = 10;

  ["Name:", "Signature:", "Date:"].forEach((label, i) => {
    const ly = y + i * lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(labelFont);
    doc.setTextColor(...GRAY);
    doc.text(label, LM, ly);
    if (label === "Name:" && refill.createdBy?.name) {
      doc.setTextColor(...DARK);
      doc.text(refill.createdBy.name, LM + 14, ly);
    }
    doc.setDrawColor(...TABLE_LINE);
    doc.setLineWidth(0.4);
    doc.line(LM + 14, ly + 1, LM + sigColW, ly + 1);
  });

  ["Name:", "Signature:", "Date:"].forEach((label, i) => {
    const ly = y + i * lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(labelFont);
    doc.setTextColor(...GRAY);
    doc.text(label, rxSig, ly);
    doc.setDrawColor(...TABLE_LINE);
    doc.setLineWidth(0.4);
    doc.line(rxSig + 14, ly + 1, rxSig + sigColW, ly + 1);
  });

  drawPageFooter(doc, pageNum);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const safeFilename = `Refill-Delivery-Note-${refill.refillNo.replace(/[^a-zA-Z0-9\-_]/g, "-")}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}
