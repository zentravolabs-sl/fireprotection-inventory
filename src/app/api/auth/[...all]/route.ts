// ============================================================
// src/app/api/auth/[...all]/route.ts
// Better Auth catch-all API route handler.
//
// All Better Auth endpoints (sign-in, sign-out, session, etc.)
// are served from /api/auth/* via this route.
// ============================================================

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
