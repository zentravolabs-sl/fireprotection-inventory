// ============================================================
// src/lib/email.ts
// Email sending utility using Resend.
//
// Provides:
//   sendWeeklyStockReportEmail()  — renders + sends the template
//   sendEmail()                    — generic low-level helper
// ============================================================

import { Resend } from "resend";
import { render } from "@react-email/components";
import WeeklyStockReportEmail, {
  buildEmailSubject,
} from "../../emails/WeeklyStockReportEmail";
import type { WeeklyStockReportData } from "@/lib/services/weeklyStockReportService";
import * as React from "react";

// ── Resend singleton ──────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("[Email] RESEND_API_KEY environment variable is not set.");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ── Generic send helper ───────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const resend = getResend();
  const sender = from ?? process.env.EMAIL_FROM ?? "info@zentravolabs.com";

  const result = await resend.emails.send({
    from: sender,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`[Resend] Send failed: ${result.error.message}`);
  }

  return result.data;
}

// ── Weekly Stock Report sender ────────────────────────────────

/**
 * Renders WeeklyStockReportEmail and sends it to all configured recipients.
 *
 * Recipients are read from:
 *   STOCK_REPORT_EMAILS=boss@company.com,manager@company.com
 *
 * Falls back to EMAIL_FROM if STOCK_REPORT_EMAILS is not set.
 */
export async function sendWeeklyStockReportEmail(
  data: WeeklyStockReportData
): Promise<{ sentTo: string[] }> {
  const recipientEnv =
    process.env.STOCK_REPORT_EMAILS ?? process.env.EMAIL_FROM ?? "";

  if (!recipientEnv) {
    throw new Error(
      "[Email] No recipient configured. Set STOCK_REPORT_EMAILS in your environment."
    );
  }

  const recipients = recipientEnv
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("[Email] STOCK_REPORT_EMAILS is set but contains no valid addresses.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const companyName = "CDN Fire Engineering";

  // Render React Email → HTML string
  const emailElement = React.createElement(WeeklyStockReportEmail, {
    companyName,
    reportPeriod: data.reportPeriod,
    summary: data.summary,
    stockMovementItems: data.stockMovementItems,
    topUsedItems: data.topUsedItems,
    lowStockItems: data.lowStockItems,
    outOfStockItems: data.outOfStockItems,
    appUrl: appUrl || undefined,
  });

  const html = await render(emailElement);

  const subject = buildEmailSubject(data.reportPeriod.from, data.reportPeriod.to);

  await sendEmail({ to: recipients, subject, html });

  return { sentTo: recipients };
}
