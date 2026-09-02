// ============================================================
// emails/WeeklyStockReportEmail.tsx
// React Email template for the Weekly Stock Report.
// PRESENTATION ONLY — no database calls inside this file.
// Used by both the scheduled cron job and the manual test endpoint.
// ============================================================

import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ── Types ────────────────────────────────────────────────────

export interface StockMovementItem {
  name: string;
  categoryName: string;
  openingQty: number;
  receivedQty: number;
  usedQty: number;
  remainingQty: number;
}

export interface TopUsedItem {
  rank: number;
  name: string;
  categoryName: string;
  usedQty: number;
  unit: string;
}

export interface LowStockItem {
  name: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  requiredQty: number;
  unit: string;
}

export interface OutOfStockItem {
  name: string;
  categoryName: string;
  minStock: number;
  unit: string;
}

export interface WeeklyStockReportProps {
  companyName: string;
  reportPeriod: { from: Date; to: Date };
  summary: {
    openingStock: number;
    stockIn: number;
    stockOut: number;
    adjustments: number;
    currentStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  stockMovementItems: StockMovementItem[];
  topUsedItems: TopUsedItem[];
  lowStockItems: LowStockItem[];
  outOfStockItems: OutOfStockItem[];
  appUrl?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Styles ───────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
};

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: "#b91c1c",
  padding: "28px 40px 24px",
};

const headerLogoColStyle: React.CSSProperties = {
  width: "72px",
  verticalAlign: "middle",
  paddingRight: "16px",
};

const headerTextColStyle: React.CSSProperties = {
  verticalAlign: "middle",
};

const headerBrandStyle: React.CSSProperties = {
  color: "#fecaca",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "2.5px",
  textTransform: "uppercase",
  margin: "0 0 3px",
};

const headerTitleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0 0 3px",
  letterSpacing: "-0.3px",
};

const headerSubStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontSize: "12px",
  margin: "0",
  fontWeight: "400",
};

const headerDividerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.25)",
  margin: "18px 0 14px",
};

const headerPeriodLabelStyle: React.CSSProperties = {
  color: "#fecaca",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const headerPeriodValueStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const sectionPadStyle: React.CSSProperties = {
  padding: "28px 40px 0",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "#6b7280",
  margin: "0 0 16px",
};

const hrStyle: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  margin: "0 40px",
};

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#6b7280",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#111827",
  margin: "0",
};

const kpiValueRedStyle: React.CSSProperties = {
  ...kpiValueStyle,
  color: "#b91c1c",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left" as const,
  fontSize: "10px",
  fontWeight: "700",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "1px",
  paddingBottom: "10px",
  borderBottom: "2px solid #e5e7eb",
};

const thRightStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "right" as const,
};

const tdStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  padding: "10px 0",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const tdRightStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right" as const,
  fontWeight: "600",
  color: "#111827",
};

const tdBoldStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: "600",
  color: "#111827",
};

const alertBoxStyle: React.CSSProperties = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderLeft: "4px solid #f97316",
  borderRadius: "6px",
  padding: "14px 16px",
  marginBottom: "12px",
};

const dangerBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderLeft: "4px solid #ef4444",
  borderRadius: "6px",
  padding: "14px 16px",
  marginBottom: "12px",
};

const successTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#16a34a",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0",
};

const highlightListItemStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  margin: "0 0 8px",
  paddingLeft: "8px",
};

const footerStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "24px 40px",
  borderTop: "1px solid #e5e7eb",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  margin: "0 0 4px",
  textAlign: "center" as const,
};

// ── Component ────────────────────────────────────────────────

export default function WeeklyStockReportEmail({
  companyName,
  reportPeriod,
  summary,
  stockMovementItems,
  topUsedItems,
  lowStockItems,
  outOfStockItems,
  appUrl,
}: WeeklyStockReportProps) {
  const periodLabel = `${fmtDate(reportPeriod.from)} – ${fmtDate(reportPeriod.to)}`;
  const previewText = `Weekly stock report ${periodLabel} — ${summary.stockIn} units received, ${summary.stockOut} used, ${summary.lowStockCount} low-stock alerts.`;

  // Dynamic highlights
  const highlights: string[] = [];
  highlights.push(`${fmt(summary.stockIn)} units were received this week.`);
  highlights.push(`${fmt(summary.stockOut)} units were issued / used.`);
  if (summary.lowStockCount > 0) {
    highlights.push(`${summary.lowStockCount} item${summary.lowStockCount !== 1 ? "s are" : " is"} currently below minimum stock level.`);
  } else {
    highlights.push("All items are above minimum stock levels.");
  }
  if (summary.outOfStockCount > 0) {
    highlights.push(`${summary.outOfStockCount} item${summary.outOfStockCount !== 1 ? "s are" : " is"} completely out of stock.`);
  } else {
    highlights.push("No items are currently out of stock.");
  }
  if (topUsedItems.length > 0) {
    highlights.push(`${topUsedItems[0].name} had the highest usage this week (${fmt(topUsedItems[0].usedQty)} ${topUsedItems[0].unit}).`);
  }

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* ── Header ── */}
          <Section style={headerSectionStyle}>
            {/* Logo + Title row */}
            <Row>
              <Column style={headerLogoColStyle}>
                <Img
                  src={appUrl ? `${appUrl}/cdn-fire-logo-white.png` : "/cdn-fire-logo-white.png"}
                  alt="CDN Fire Logo"
                  width="60"
                  height="60"
                  style={{ display: "block", objectFit: "contain" }}
                />
              </Column>
              <Column style={headerTextColStyle}>
                <Text style={headerBrandStyle}>{companyName.toUpperCase()}</Text>
                <Heading as="h1" style={headerTitleStyle}>Weekly Stock Report</Heading>
                <Text style={headerSubStyle}>Fire Protection Management System</Text>
              </Column>
            </Row>
            {/* Divider */}
            <Hr style={headerDividerStyle} />
            {/* Period */}
            <Text style={headerPeriodLabelStyle}>Report Period</Text>
            <Text style={headerPeriodValueStyle}>{periodLabel}</Text>
          </Section>

          {/* ── Executive Summary Cards ── */}
          <Section style={sectionPadStyle}>
            <Text style={sectionTitleStyle}>Stock Summary</Text>
            <Row>
              <Column style={{ width: "25%", paddingRight: "8px" }}>
                <div style={kpiCardStyle}>
                  <Text style={kpiLabelStyle}>Opening Stock</Text>
                  <Text style={kpiValueStyle}>{fmt(summary.openingStock)}</Text>
                </div>
              </Column>
              <Column style={{ width: "25%", paddingRight: "8px" }}>
                <div style={{ ...kpiCardStyle, borderTop: "3px solid #16a34a" }}>
                  <Text style={kpiLabelStyle}>Received</Text>
                  <Text style={{ ...kpiValueStyle, color: "#16a34a" }}>{fmt(summary.stockIn)}</Text>
                </div>
              </Column>
              <Column style={{ width: "25%", paddingRight: "8px" }}>
                <div style={{ ...kpiCardStyle, borderTop: "3px solid #b91c1c" }}>
                  <Text style={kpiLabelStyle}>Used / Issued</Text>
                  <Text style={kpiValueRedStyle}>{fmt(summary.stockOut)}</Text>
                </div>
              </Column>
              <Column style={{ width: "25%" }}>
                <div style={{ ...kpiCardStyle, borderTop: "3px solid #1d4ed8" }}>
                  <Text style={kpiLabelStyle}>Current Stock</Text>
                  <Text style={{ ...kpiValueStyle, color: "#1d4ed8" }}>{fmt(summary.currentStock)}</Text>
                </div>
              </Column>
            </Row>
          </Section>

          <Hr style={{ ...hrStyle, marginTop: "28px" }} />

          {/* ── Stock Movement Summary ── */}
          <Section style={sectionPadStyle}>
            <Text style={sectionTitleStyle}>Stock Movement Summary</Text>
            <table style={tableStyle}>
              <tbody>
                {[
                  { label: "Opening Stock", value: summary.openingStock, color: "#111827" },
                  { label: "+ Stock Received", value: summary.stockIn, color: "#16a34a" },
                  { label: "− Stock Used / Issued", value: summary.stockOut, color: "#b91c1c" },
                  { label: "± Adjustments", value: summary.adjustments, color: "#6b7280" },
                  { label: "= Current Stock", value: summary.currentStock, color: "#1d4ed8" },
                ].map(({ label, value, color }, i) => (
                  <tr key={i}>
                    <td style={{
                      ...tdStyle,
                      fontWeight: i === 4 ? "700" : "400",
                      borderTop: i === 4 ? "2px solid #e5e7eb" : undefined,
                    }}>
                      {label}
                    </td>
                    <td style={{ ...tdRightStyle, color, borderTop: i === 4 ? "2px solid #e5e7eb" : undefined }}>
                      {fmt(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={{ ...hrStyle, marginTop: "28px" }} />

          {/* ── Stock Movement Detail Table ── */}
          <Section style={sectionPadStyle}>
            <Text style={sectionTitleStyle}>Stock Used This Week</Text>
            {stockMovementItems.length === 0 ? (
              <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>
                No stock movement was recorded during this reporting period.
              </Text>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "32%" }}>Item</th>
                    <th style={{ ...thStyle, width: "20%" }}>Category</th>
                    <th style={thRightStyle}>Opening</th>
                    <th style={thRightStyle}>Received</th>
                    <th style={thRightStyle}>Used</th>
                    <th style={thRightStyle}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovementItems.map((item, i) => (
                    <tr key={i}>
                      <td style={tdBoldStyle}>{item.name}</td>
                      <td style={{ ...tdStyle, color: "#6b7280", fontSize: "12px" }}>{item.categoryName}</td>
                      <td style={tdRightStyle}>{fmt(item.openingQty)}</td>
                      <td style={{ ...tdRightStyle, color: "#16a34a" }}>+{fmt(item.receivedQty)}</td>
                      <td style={{ ...tdRightStyle, color: "#b91c1c" }}>−{fmt(item.usedQty)}</td>
                      <td style={tdRightStyle}>{fmt(item.remainingQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Hr style={{ ...hrStyle, marginTop: "28px" }} />

          {/* ── Top Used Materials ── */}
          {topUsedItems.length > 0 && (
            <>
              <Section style={sectionPadStyle}>
                <Text style={sectionTitleStyle}>Top Used Materials This Week</Text>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: "8%" }}>#</th>
                      <th style={{ ...thStyle, width: "42%" }}>Item</th>
                      <th style={{ ...thStyle, width: "30%" }}>Category</th>
                      <th style={thRightStyle}>Qty Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsedItems.map((item) => (
                      <tr key={item.rank}>
                        <td style={{ ...tdStyle, color: "#9ca3af", fontWeight: "700" }}>{item.rank}</td>
                        <td style={tdBoldStyle}>{item.name}</td>
                        <td style={{ ...tdStyle, color: "#6b7280", fontSize: "12px" }}>{item.categoryName}</td>
                        <td style={{ ...tdRightStyle, color: "#b91c1c" }}>{fmt(item.usedQty)} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
              <Hr style={{ ...hrStyle, marginTop: "28px" }} />
            </>
          )}

          {/* ── Low Stock Alert ── */}
          <Section style={sectionPadStyle}>
            <Text style={{ ...sectionTitleStyle, color: summary.lowStockCount > 0 ? "#c2410c" : "#6b7280" }}>
              {summary.lowStockCount > 0 ? "⚠ Low Stock Alert" : "Low Stock Alert"}
            </Text>
            {lowStockItems.length === 0 ? (
              <Text style={successTextStyle}>✓ No low-stock items this week.</Text>
            ) : (
              <>
                {lowStockItems.map((item, i) => (
                  <div key={i} style={alertBoxStyle}>
                    <Text style={{ fontSize: "13px", fontWeight: "700", color: "#9a3412", margin: "0 0 4px" }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: "12px", color: "#c2410c", margin: "0" }}>
                      {item.categoryName} &nbsp;|&nbsp;
                      Current: <strong>{fmt(item.currentStock)}</strong> {item.unit} &nbsp;|&nbsp;
                      Minimum: <strong>{fmt(item.minStock)}</strong> {item.unit} &nbsp;|&nbsp;
                      Required: <strong style={{ color: "#b91c1c" }}>{fmt(item.requiredQty)}</strong> {item.unit} &nbsp;|&nbsp;
                      <strong>LOW STOCK</strong>
                    </Text>
                  </div>
                ))}
              </>
            )}
          </Section>

          <Hr style={{ ...hrStyle, marginTop: "28px" }} />

          {/* ── Out of Stock ── */}
          <Section style={sectionPadStyle}>
            <Text style={{ ...sectionTitleStyle, color: summary.outOfStockCount > 0 ? "#b91c1c" : "#6b7280" }}>
              {summary.outOfStockCount > 0 ? "🚨 Out of Stock" : "Out of Stock"}
            </Text>
            {outOfStockItems.length === 0 ? (
              <Text style={successTextStyle}>✓ No items are currently out of stock.</Text>
            ) : (
              <>
                {outOfStockItems.map((item, i) => (
                  <div key={i} style={dangerBoxStyle}>
                    <Text style={{ fontSize: "13px", fontWeight: "700", color: "#7f1d1d", margin: "0 0 4px" }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: "12px", color: "#b91c1c", margin: "0" }}>
                      {item.categoryName} &nbsp;|&nbsp;
                      Current Stock: <strong>0</strong> {item.unit} &nbsp;|&nbsp;
                      Minimum Level: <strong>{fmt(item.minStock)}</strong> {item.unit} &nbsp;|&nbsp;
                      <strong>OUT OF STOCK</strong>
                    </Text>
                  </div>
                ))}
              </>
            )}
          </Section>

          <Hr style={{ ...hrStyle, marginTop: "28px" }} />

          {/* ── Weekly Highlights ── */}
          <Section style={sectionPadStyle}>
            <Text style={sectionTitleStyle}>Weekly Highlights</Text>
            {highlights.map((h, i) => (
              <Text key={i} style={highlightListItemStyle}>• {h}</Text>
            ))}
          </Section>

          {/* ── View Full Report Button ── */}
          {appUrl && (
            <Section style={{ padding: "16px 40px 28px" }}>
              <a
                href={`${appUrl}/inventory`}
                style={{
                  display: "inline-block",
                  backgroundColor: "#b91c1c",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  letterSpacing: "0.3px",
                }}
              >
                View Full Inventory Report →
              </a>
            </Section>
          )}

          {/* ── Footer ── */}
          <Section style={footerStyle}>
            <Text style={{ ...footerTextStyle, fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
              {companyName} — Fire Protection Management System
            </Text>
            <Text style={footerTextStyle}>
              This is an automated weekly stock report.
            </Text>
            <Text style={footerTextStyle}>
              Generated automatically every Friday at 6:00 PM.
            </Text>
            <Text style={{ ...footerTextStyle, marginTop: "8px", fontStyle: "italic" }}>
              Please do not reply to this automated email.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Subject line helper (exported for reuse in send functions) ──

export function buildEmailSubject(from: Date, to: Date): string {
  const fromStr = from.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const toStr = to.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `Weekly Stock Report | ${fromStr} – ${toStr}`;
}
