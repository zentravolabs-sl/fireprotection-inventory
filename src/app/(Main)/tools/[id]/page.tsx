// ============================================================
// src/app/(Main)/admin/tools/[id]/page.tsx
// Tool Detail Page — shows current status, assignment info, and history tabs.
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { getToolWithHistory } from "@/lib/repositories/toolAssignmentRepository";
import { ToolDetailsClient } from "./ToolDetailsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { id } = await params;
  const toolId = Number(id);

  if (isNaN(toolId)) notFound();

  const tool = await getToolWithHistory(toolId);
  if (!tool) notFound();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ToolDetailsClient tool={tool as any} />
    </main>
  );
}
