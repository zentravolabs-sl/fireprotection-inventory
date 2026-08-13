// ============================================================
// src/app/api/notifications/route.ts
// REST API for reading and marking in-app notifications.
//
// GET  /api/notifications            → list for current user
// GET  /api/notifications?since=ID   → only notifications newer
//                                      than the given ID (for
//                                      toast delta detection)
// POST /api/notifications            → mark one or all as read
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/notifications ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Optional ?since=<notificationId> — used by toast polling to detect new ones
    const sinceParam = req.nextUrl.searchParams.get("since");
    const sinceId = sinceParam ? parseInt(sinceParam, 10) : null;

    // Build the where clause — always scoped to the current user
    const where: Record<string, unknown> = { userId };
    if (sinceId && !isNaN(sinceId)) {
      where.id = { gt: sinceId };
    }

    // Fetch up to 25 most recent notifications for this user
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: sinceId ? 10 : 25, // smaller slice when doing delta checks
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        materialRequestId: true,
        createdAt: true,
      },
    });

    // Pending material request count for the sidebar badge
    // Admins see all PENDING; engineers see their own pending (approved+)
    const userRole = (session.user as { role?: string }).role ?? "USER";

    let pendingMRCount = 0;
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      pendingMRCount = await prisma.materialRequest.count({
        where: { status: "PENDING" },
      });
    } else if (userRole === "PROJECT_MANAGER" || userRole === "ENGINEER") {
      pendingMRCount = await prisma.materialRequest.count({
        where: {
          engineerId: userId,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
    }

    // Only return unreadCount when doing a full fetch (no since param)
    const unreadCount = sinceId
      ? notifications.filter((n) => !n.isRead).length
      : await prisma.notification.count({ where: { userId, isRead: false } });

    return NextResponse.json({
      notifications,
      unreadCount,
      pendingMRCount,
    });
  } catch (err) {
    console.error("[GET /api/notifications] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST /api/notifications ──────────────────────────────────────────────────
// Body: { action: "mark_read", id?: number }
// If id is provided → mark that single notification as read.
// If id is omitted  → mark ALL of this user's notifications as read.

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { action, id } = body as { action: string; id?: number };

    if (action !== "mark_read") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (typeof id === "number") {
      // Mark a single notification as read — scoped to this user for security
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else {
      // Mark ALL of this user's notifications as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/notifications] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
