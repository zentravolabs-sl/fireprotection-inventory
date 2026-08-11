// ============================================================
// src/app/(Main)/admin/page.tsx
// Admin panel — ADMIN and SUPER_ADMIN access.
// ============================================================

import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck, Tag, Layers, Building2, Package, Wrench, Clock } from "lucide-react";

export const metadata = {
  title: "Admin Panel — CDN Fire Engineering",
};

export default async function AdminPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const user = session.user as { name: string; role?: string };

  const modules = [
    {
      href: "/admin/categories",
      icon: Tag,
      label: "Categories",
      description: "Manage top-level equipment and product categories.",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "hover:border-red-200",
    },
    {
      href: "/admin/sub-categories",
      icon: Layers,
      label: "Sub-Categories",
      description: "Manage sub-categories nested under each category.",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "hover:border-orange-200",
    },
    {
      href: "/admin/suppliers",
      icon: Building2,
      label: "Suppliers",
      description: "Manage equipment suppliers, vendors, and contact details.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-200",
    },
    {
      href: "/admin/inventory",
      icon: Package,
      label: "Inventory",
      description: "Manage stock items, quantities, and supplier links.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-200",
    },
    {
      href: "/admin/tools",
      icon: Wrench,
      label: "Tools",
      description: "Manage tools, serial numbers, condition status, and availability.",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "hover:border-purple-200",
    },
    {
      href: "/admin/customers",
      icon: Users,
      label: "Customers",
      description: "Manage client companies, contact details, and customer accounts.",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "hover:border-cyan-200",
    },
    {
      href: "/inventory/expiry",
      icon: Clock,
      label: "Expiry Management",
      description: "Track stock batch expiry, FEFO allocation rules, alert windows, and valuation.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1524]">
      <nav className="bg-[#0F1524] border-b border-[#1e2a3d] shadow-[0_1px_0_0_#1e2a3d,0_4px_24px_rgba(0,0,0,0.45)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a657a] hover:text-[#e02424] transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <span className="text-[#1e2a3d]">|</span>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#e02424]" />
            <span className="font-bold text-[#dce3ef]">Admin Panel</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef] mb-2">Admin Panel</h1>
        <p className="text-[#5a657a] mb-8">
          Logged in as <strong className="text-[#dce3ef]">{user.name}</strong> <span className="text-[#3d4c62]">({user.role})</span>
        </p>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ href, icon: Icon, label, description, color, bg, border }) => (
            <Link
              key={href}
              href={href}
              className={`group bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_0_0_1px_#e02424] hover:border-[#e02424]/40 ${border}`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 opacity-80`}>
                <Icon size={20} className={color} />
              </div>
              <h2 className="text-base font-bold text-[#dce3ef] group-hover:text-white transition-colors">
                {label}
              </h2>
              <p className="text-[#5a657a] text-sm mt-1 leading-snug">{description}</p>
            </Link>
          ))}

          {/* Placeholder card */}
          <div className="bg-[#0F1524] rounded-2xl border border-dashed border-[#1e2a3d] p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3 opacity-50">
            <Users size={28} className="text-[#3d4c62]" />
            <p className="text-[#5a657a] text-sm font-medium">More modules coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
