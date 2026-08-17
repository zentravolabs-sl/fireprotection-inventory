import "dotenv/config";
import { getWeeklyStockReport } from "./src/lib/services/weeklyStockReportService";
import { sendWeeklyStockReportEmail } from "./src/lib/email";

async function run() {
  console.log(`[${new Date().toLocaleTimeString()}] Generating Weekly Stock Report for 5:00 PM...`);
  try {
    const reportData = await getWeeklyStockReport();
    console.log("Report Data Summary:", reportData.summary);
    console.log("Sending email to:", process.env.STOCK_REPORT_EMAILS);
    const result = await sendWeeklyStockReportEmail(reportData);
    console.log("✅ SUCCESS! Email sent successfully to:", result.sentTo);
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

run();
