// ============================================================
// src/app/api/delivery-notes/[id]/pdf/route.ts
// Secure server-side Delivery Note PDF generation endpoint.
// GET /api/delivery-notes/:id/pdf
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
// jsPDF works in Node.js — no browser APIs needed
import { jsPDF } from "jspdf";

export const dynamic = "force-dynamic";

// ─── Helper: draw a horizontal rule ──────────────────────────────────────────
function hRule(doc: jsPDF, y: number, lm: number, rEdge: number, color: [number, number, number] = [220, 220, 220]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rEdge, y);
}

// ─── Helper: wrapped text with line count return ──────────────────────────────
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
  // ── 1. Authentication ────────────────────────────────────────────────────────
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
    permissions.has("fire_extinguisher.view");

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. Parse & validate ID ───────────────────────────────────────────────────
  const { id } = await ctx.params;
  const deliveryId = Number(id);

  if (isNaN(deliveryId) || deliveryId <= 0) {
    return NextResponse.json({ error: "Invalid delivery note ID" }, { status: 400 });
  }

  // ── 4. Fetch data ────────────────────────────────────────────────────────────
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      items: {
        include: {
          fireExtinguisherUnit: {
            include: { inventory: true },
          },
        },
        orderBy: { id: "asc" },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!deliveryNote) {
    return NextResponse.json({ error: "Delivery Note not found" }, { status: 404 });
  }

  // ── 5. Generate PDF ──────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Layout constants
  const PW = 210; // page width mm
  const PH = 297; // page height mm
  const LM = 14;  // left margin
  const RM = 196; // right margin
  const CW = RM - LM; // content width
  const RED: [number, number, number] = [185, 28, 28];
  const DARK: [number, number, number] = [30, 30, 30];
  const GRAY: [number, number, number] = [100, 100, 100];
  const LIGHT_GRAY: [number, number, number] = [240, 240, 240];
  const TABLE_LINE: [number, number, number] = [200, 200, 200];

  let pageNum = 1;

  // Track y position
  let y = 14;

  // ── PAGE HEADER (repeated each page) ────────────────────────────────────────
  const drawPageHeader = (d: jsPDF) => {
    // Red accent bar at top
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

    // Company name & info
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

    // Right side: DELIVERY NOTE label
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(...RED);
    d.text("DELIVERY NOTE", RM, y + 3, { align: "right" });

    d.setFontSize(9);
    d.setTextColor(...DARK);
    d.text(`No: ${deliveryNote.deliveryNo}`, RM, y + 8.5, { align: "right" });

    d.setFontSize(8);
    d.setTextColor(...GRAY);
    d.setFont("helvetica", "normal");
    const dDate = new Date(deliveryNote.deliveryDate).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
    d.text(`Date: ${dDate}`, RM, y + 13.5, { align: "right" });

    y += 18;

    // Red separator line
    d.setDrawColor(...RED);
    d.setLineWidth(0.6);
    d.line(LM, y, RM, y);
    y += 5;
  };

  // ── FOOTER (per page) ────────────────────────────────────────────────────────
  const drawPageFooter = (d: jsPDF, pNum: number) => {
    const footerY = PH - 10;
    d.setDrawColor(...TABLE_LINE);
    d.setLineWidth(0.3);
    d.line(LM, footerY - 2, RM, footerY - 2);
    d.setFont("helvetica", "normal");
    d.setFontSize(7);
    d.setTextColor(...GRAY);
    d.text("Thank you for your business. All fire extinguishers are inspected prior to dispatch.", LM, footerY);
    d.text(`Page ${pNum}`, RM, footerY, { align: "right" });
  };

  // ── DRAW FIRST PAGE HEADER ───────────────────────────────────────────────────
  drawPageHeader(doc);

  // ── CUSTOMER / DELIVERY INFO BOX ─────────────────────────────────────────────
  const boxTop = y;
  const halfCW = CW / 2 - 3;

  // Left box
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(LM, boxTop, halfCW, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("DELIVER TO:", LM + 3, boxTop + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(deliveryNote.customer.companyName, LM + 3, boxTop + 10);

  let leftY = boxTop + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  if (deliveryNote.customer.contactPerson) {
    doc.text(`Attn: ${deliveryNote.customer.contactPerson}`, LM + 3, leftY);
    leftY += 4;
  }
  if (deliveryNote.customer.phone) {
    doc.text(`Phone: ${deliveryNote.customer.phone}`, LM + 3, leftY);
    leftY += 4;
  }
  if (deliveryNote.customer.email) {
    doc.text(`Email: ${deliveryNote.customer.email}`, LM + 3, leftY);
  }

  // Right box
  const rxStart = LM + halfCW + 6;
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(rxStart, boxTop, halfCW, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("DELIVERY ADDRESS:", rxStart + 3, boxTop + 5);

  const addr = deliveryNote.deliveryAddress || deliveryNote.customer.address || "Client Premises";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  wrappedText(doc, addr, rxStart + 3, boxTop + 10, halfCW - 6, 4);

  y = boxTop + 32;

  // ── NOTES SECTION ─────────────────────────────────────────────────────────────
  if (deliveryNote.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text("NOTES:", LM, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const noteLines = doc.splitTextToSize(deliveryNote.notes, CW) as string[];
    noteLines.forEach((line: string) => {
      doc.text(line, LM, y);
      y += 4;
    });
    y += 2;
  }

  // ── ITEMS TABLE HEADER ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(`DISPATCHED FIRE EXTINGUISHER UNITS (${deliveryNote.items.length} Item${deliveryNote.items.length !== 1 ? "s" : ""})`, LM, y);
  y += 3;

  // Column widths
  const COL_NO = 8;
  const COL_CODE = 28;
  const COL_DESC = 80;
  const COL_SERIAL = 44;
  const COL_UNIT = CW - COL_NO - COL_CODE - COL_DESC - COL_SERIAL;

  const ROW_H = 7;
  const TABLE_FONT_SIZE = 8;

  // Table header row
  doc.setFillColor(...RED);
  doc.rect(LM, y, CW, ROW_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  let cx = LM + 2;
  doc.text("#", cx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
  cx += COL_NO;
  doc.text("UNIT CODE", cx + 2, y + ROW_H - 2);
  cx += COL_CODE;
  doc.text("ITEM DESCRIPTION", cx + 2, y + ROW_H - 2);
  cx += COL_DESC;
  doc.text("SERIAL NO.", cx + 2, y + ROW_H - 2);
  cx += COL_SERIAL;
  doc.text("UNIT", cx + 2, y + ROW_H - 2);

  y += ROW_H;

  // Table rows
  deliveryNote.items.forEach((item, index) => {
    // Check if we need a new page (leave 60mm for signature block)
    if (y > PH - 70) {
      drawPageFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = 14;
      drawPageHeader(doc);

      // Reprint table header on new page
      doc.setFillColor(...RED);
      doc.rect(LM, y, CW, ROW_H, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      let hcx = LM + 2;
      doc.text("#", hcx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
      hcx += COL_NO;
      doc.text("UNIT CODE", hcx + 2, y + ROW_H - 2);
      hcx += COL_CODE;
      doc.text("ITEM DESCRIPTION (CONTINUED)", hcx + 2, y + ROW_H - 2);
      hcx += COL_DESC;
      doc.text("SERIAL NO.", hcx + 2, y + ROW_H - 2);
      hcx += COL_SERIAL;
      doc.text("UNIT", hcx + 2, y + ROW_H - 2);
      y += ROW_H;
    }

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 248, 248);
      doc.rect(LM, y, CW, ROW_H, "F");
    }

    // Draw row border
    doc.setDrawColor(...TABLE_LINE);
    doc.setLineWidth(0.2);
    doc.rect(LM, y, CW, ROW_H);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(TABLE_FONT_SIZE);
    doc.setTextColor(...DARK);

    let rcx = LM + 2;
    // #
    doc.text(String(index + 1), rcx + COL_NO / 2, y + ROW_H - 2, { align: "center" });
    rcx += COL_NO;
    // Unit code
    doc.setFont("helvetica", "bold");
    doc.text(item.fireExtinguisherUnit.unitCode, rcx + 2, y + ROW_H - 2);
    rcx += COL_CODE;
    // Description
    doc.setFont("helvetica", "normal");
    const descText = item.fireExtinguisherUnit.inventory.name;
    const descLines = doc.splitTextToSize(descText, COL_DESC - 4) as string[];
    doc.text(descLines[0] ?? "", rcx + 2, y + ROW_H - 2);
    rcx += COL_DESC;
    // Serial
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(item.fireExtinguisherUnit.serialNumber ?? "—", rcx + 2, y + ROW_H - 2);
    rcx += COL_SERIAL;
    // Unit
    doc.text("Pcs", rcx + 2, y + ROW_H - 2);

    y += ROW_H;
  });

  // Total row
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(LM, y, CW, ROW_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("TOTAL UNITS DISPATCHED:", LM + 2, y + ROW_H - 2);
  doc.text(String(deliveryNote.items.length), LM + COL_NO + COL_CODE + COL_DESC + COL_SERIAL + 2, y + ROW_H - 2);
  y += ROW_H + 8;

  // ── SIGNATURE SECTION ─────────────────────────────────────────────────────────
  // Ensure signatures are on the same page — if close to edge, push to next page
  if (y > PH - 72) {
    drawPageFooter(doc, pageNum);
    doc.addPage();
    pageNum++;
    y = 20;
    drawPageHeader(doc);
  }

  hRule(doc, y, LM, RM, [180, 180, 180]);
  y += 6;

  const sigColW = (CW - 10) / 2;

  // Delivered By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("DELIVERED BY:", LM, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("CDN Fire Engineering Logistics", LM, y + 5);

  // Received By
  const rxSig = LM + sigColW + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("RECEIVED IN GOOD CONDITION BY:", rxSig, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(deliveryNote.customer.companyName, rxSig, y + 5);

  y += 14;

  // Signature lines
  const labelFont = 7.5;
  const lineGap = 10;

  // Left column
  ["Name:", "Signature:", "Date:"].forEach((label, i) => {
    const ly = y + i * lineGap;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(labelFont);
    doc.setTextColor(...GRAY);
    doc.text(label, LM, ly);
    // Pre-fill name for delivered-by
    if (label === "Name:" && deliveryNote.createdBy?.name) {
      doc.setTextColor(...DARK);
      doc.text(deliveryNote.createdBy.name, LM + 14, ly);
    }
    doc.setDrawColor(...TABLE_LINE);
    doc.setLineWidth(0.4);
    doc.line(LM + 14, ly + 1, LM + sigColW, ly + 1);
  });

  // Right column
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

  y += 3 * lineGap + 4;

  // ── FOOTER on last page ───────────────────────────────────────────────────────
  drawPageFooter(doc, pageNum);

  // ── 6. Return PDF binary ─────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const safeFilename = `Delivery-Note-${deliveryNote.deliveryNo.replace(/[^a-zA-Z0-9\-_]/g, "-")}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}
