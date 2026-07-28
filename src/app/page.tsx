// ============================================================
// src/app/page.tsx
// Root page — redirects to /dashboard for authenticated users
// or to /login for guests. Middleware handles this but we add
// an explicit server-side redirect as a safety net.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}
