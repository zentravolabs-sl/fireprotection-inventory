// ============================================================
// src/app/(Main)/admin/tools/[id]/page.tsx
// Tool Detail Page — shows current status, assignment info, and history tabs.
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { getToolWithHistory } from "@/lib/repositories/toolAssignmentRepository";
import { ToolDetailsClient } from "./ToolDetailsClient";

export const revalidate = 0;

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
    <div className="min-h-screen bg-[#0F1524]">
      <nav className="bg-[#0F1524] border-b border-[#1e2a3d] shadow-[0_1px_0_0_#1e2a3d,0_4px_24px_rgba(0,0,0,0.45)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin/tools"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a657a] hover:text-[#e02424] transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Tools</span>
          </Link>
          <span className="text-[#1e2a3d]">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e02424]/10 flex items-center justify-center">
              <Wrench size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">{tool.name}</span>
            <span className="font-mono text-xs text-[#5a657a]">({tool.toolCode})</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ToolDetailsClient tool={tool as any} />
      </main>
    </div>
  );
}
