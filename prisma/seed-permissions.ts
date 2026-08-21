// ============================================================
// prisma/seed-permissions.ts
// Idempotent seeding script for system permissions & role mappings.
// ============================================================

import type { PrismaClient } from "../src/generated/prisma/client";

export interface PermissionDefinition {
  key: string;
  name: string;
  module: string;
  description?: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // ── Projects Module ──
  { key: "project.view", name: "View Projects", module: "Projects", description: "View projects and project detail pages" },
  { key: "project.create", name: "Create Project", module: "Projects", description: "Create new fire protection projects" },
  { key: "project.edit", name: "Edit Project", module: "Projects", description: "Update project information and budget estimates" },
  { key: "project.delete", name: "Delete Project", module: "Projects", description: "Delete projects" },
  { key: "project.complete", name: "Complete Project", module: "Projects", description: "Mark active projects as completed" },

  // ── Inventory Master Module ──
  { key: "inventory.view", name: "View Inventory", module: "Inventory", description: "View inventory master catalogue" },
  { key: "inventory.create", name: "Create Inventory Item", module: "Inventory", description: "Add new inventory master items" },
  { key: "inventory.edit", name: "Edit Inventory Item", module: "Inventory", description: "Edit inventory master items" },
  { key: "inventory.delete", name: "Delete Inventory Item", module: "Inventory", description: "Delete inventory master items" },

  // ── Stock & Warehouse Module ──
  { key: "stock.receive", name: "Stock Receive", module: "Stock", description: "Process incoming goods receive documents" },
  { key: "stock.issue", name: "Stock Issue", module: "Stock", description: "Issue stock FIFO to projects" },
  { key: "stock.return", name: "Stock Return", module: "Stock", description: "Process returned materials from site" },
  { key: "stock.transfer", name: "Stock Transfer", module: "Stock", description: "Transfer stock between projects or locations" },
  { key: "stock.adjust", name: "Stock Adjust", module: "Stock", description: "Perform manual stock level adjustments" },
  { key: "stock.view_history", name: "Stock Movement History", module: "Stock", description: "View inventory ledger and movement logs" },

  // ── Material Requests Module ──
  { key: "material_request.view", name: "View Material Requests", module: "Material Requests", description: "View site material requests" },
  { key: "material_request.create", name: "Create Material Request", module: "Material Requests", description: "Create material request drafts" },
  { key: "material_request.edit", name: "Edit Material Request", module: "Material Requests", description: "Modify material requests" },
  { key: "material_request.submit", name: "Submit Material Request", module: "Material Requests", description: "Submit material requests for PM approval" },
  { key: "material_request.approve", name: "Approve Material Request", module: "Material Requests", description: "Approve material requests for FIFO issuance" },
  { key: "material_request.reject", name: "Reject Material Request", module: "Material Requests", description: "Reject pending material requests" },
  { key: "material_request.cancel", name: "Cancel Material Request", module: "Material Requests", description: "Cancel material requests" },

  // ── Labour Management Module ──
  { key: "labour.view", name: "View Labour", module: "Labour", description: "View physical labour master and assignments" },
  { key: "labour.create", name: "Create Labour", module: "Labour", description: "Create new physical worker master records" },
  { key: "labour.edit", name: "Edit Labour", module: "Labour", description: "Edit physical worker records" },
  { key: "labour.delete", name: "Delete Labour", module: "Labour", description: "Delete or deactivate labour records" },
  { key: "labour.assign_project", name: "Assign Labour", module: "Labour", description: "Assign workers to project sites" },
  { key: "labour.attendance", name: "Labour Attendance & OT", module: "Labour", description: "Log overtime and attendance for site labour" },
  { key: "labour.manage_cost", name: "Manage Labour Cost", module: "Labour", description: "Set total allocated project cost for labour" },

  // ── Internal Staff Module ──
  { key: "project_staff.view", name: "View Project Staff", module: "Project Staff", description: "View assigned site engineers and project managers" },
  { key: "project_staff.assign", name: "Assign Project Staff", module: "Project Staff", description: "Assign internal staff (Engineers/PMs) to projects" },
  { key: "project_staff.release", name: "Release Project Staff", module: "Project Staff", description: "Release internal staff from projects" },
  { key: "project_staff.attendance", name: "Staff Attendance & OT", module: "Project Staff", description: "Log overtime and attendance for staff" },
  { key: "project_staff.manage_salary", name: "Manage Staff Salary", module: "Project Staff", description: "Set allocated project salary costs for staff" },
  { key: "project_staff.manage_ot", name: "Manage Staff OT", module: "Project Staff", description: "Configure staff overtime rates and costs" },

  // ── Expiry Management Module ──
  { key: "expiry.view", name: "View Expiry Management", module: "Expiry", description: "View stock batch expiration dates and alerts" },
  { key: "expiry.manage", name: "Manage Expiry", module: "Expiry", description: "Update batch manufacturing and expiration dates" },
  { key: "expiry.quarantine", name: "Quarantine Expired Stock", module: "Expiry", description: "Mark expired stock batches as quarantined" },
  { key: "expiry.report", name: "Expiry Reports", module: "Expiry", description: "Generate expiration forecast reports" },

  // ── Supplier Module ──
  { key: "supplier.view", name: "View Suppliers", module: "Suppliers", description: "View vendor and supplier directory" },
  { key: "supplier.create", name: "Create Supplier", module: "Suppliers", description: "Add new vendor / supplier records" },
  { key: "supplier.edit", name: "Edit Supplier", module: "Suppliers", description: "Edit vendor / supplier details" },
  { key: "supplier.delete", name: "Delete Supplier", module: "Suppliers", description: "Delete vendor / supplier records" },

  // ── Customer Module ──
  { key: "customer.view", name: "View Customers", module: "Customers", description: "View customer / client directory" },
  { key: "customer.create", name: "Create Customer", module: "Customers", description: "Add new customer / client records" },
  { key: "customer.edit", name: "Edit Customer", module: "Customers", description: "Edit customer / client details" },
  { key: "customer.delete", name: "Delete Customer", module: "Customers", description: "Delete customer / client records" },

  // ── Assets & Tools Module ──
  { key: "tool.view", name: "View Tools", module: "Tools", description: "View physical equipment and tool assignments" },
  { key: "tool.create", name: "Create Tool", module: "Tools", description: "Register new tools in inventory" },
  { key: "tool.edit", name: "Edit Tool", module: "Tools", description: "Edit tool condition and serial numbers" },
  { key: "tool.delete", name: "Delete Tool", module: "Tools", description: "Retire or delete tools" },
  { key: "tool.assign", name: "Assign Tool", module: "Tools", description: "Issue tools to project site engineers" },
  { key: "tool.transfer", name: "Transfer Tool", module: "Tools", description: "Transfer assigned tools between projects" },
  { key: "tool.return", name: "Return Tool", module: "Tools", description: "Log tool returns and return conditions" },

  // ── Project Transfers Module ──
  { key: "project_transfer.view", name: "View Project Transfers", module: "Project Transfers", description: "View project-to-project stock transfers" },
  { key: "project_transfer.create", name: "Create Project Transfer", module: "Project Transfers", description: "Request stock transfers between projects" },
  { key: "project_transfer.approve", name: "Approve Project Transfer", module: "Project Transfers", description: "Approve project stock transfer requests" },
  { key: "project_transfer.complete", name: "Complete Project Transfer", module: "Project Transfers", description: "Finalize inter-project stock transfers" },
  { key: "project_transfer.cancel", name: "Cancel Project Transfer", module: "Project Transfers", description: "Cancel inter-project stock transfers" },

  // ── Reports Module ──
  { key: "report.view", name: "View Reports", module: "Reports", description: "Access analytics and summary reports" },
  { key: "report.project", name: "Project Reports", module: "Reports", description: "View project cost, variance & progress reports" },
  { key: "report.inventory", name: "Inventory Reports", module: "Reports", description: "View stock valuation & consumption reports" },
  { key: "report.financial", name: "Financial Reports", module: "Reports", description: "View profit margin and central ledger financial reports" },

  // ── User Management Module ──
  { key: "user.view", name: "View Users", module: "Users", description: "View user directory and profiles" },
  { key: "user.create", name: "Create User", module: "Users", description: "Add new user accounts" },
  { key: "user.edit", name: "Edit User", module: "Users", description: "Edit user profile, role, and active status" },
  { key: "user.delete", name: "Delete User", module: "Users", description: "Deactivate or remove user accounts" },

  // ── Role & Permission Management Module ──
  { key: "role.view", name: "View Roles", module: "Roles", description: "View role definitions" },
  { key: "role.manage", name: "Manage Roles & Permissions", module: "Roles", description: "Configure system permissions for each role" },
  { key: "permission.view", name: "View Permissions", module: "Permissions", description: "View granular system permission keys" },
  { key: "permission.manage", name: "Manage Permissions", module: "Permissions", description: "Modify system permission structure" },

  // ── Fire Extinguisher Module ──
  { key: "fire_extinguisher.view", name: "View Fire Extinguishers", module: "Fire Extinguishers", description: "View physical units, assignments, refills, and client delivery notes" },
  { key: "fire_extinguisher.assign", name: "Assign Fire Extinguishers", module: "Fire Extinguishers", description: "Assign fire extinguisher units to projects or customers" },
  { key: "fire_extinguisher.deliver", name: "Client Delivery Note", module: "Fire Extinguishers", description: "Create and confirm direct client delivery notes" },
  { key: "fire_extinguisher.refill", name: "Refill Management", module: "Fire Extinguishers", description: "Start and complete fire extinguisher refills" },
  { key: "fire_extinguisher.return", name: "Return Fire Extinguishers", module: "Fire Extinguishers", description: "Return assigned fire extinguishers back to warehouse" },
  { key: "fire_extinguisher.manage", name: "Manage Fire Extinguishers", module: "Fire Extinguishers", description: "Register and manage physical fire extinguisher master units" },

  // ── Customer Refills Module ──
  { key: "customerRefills.view", name: "View Customer Refills", module: "Customer Refills", description: "View customer-owned fire extinguisher refill jobs" },
  { key: "customerRefills.create", name: "Create Customer Refill", module: "Customer Refills", description: "Create customer refill job drafts" },
  { key: "customerRefills.edit", name: "Edit Customer Refill", module: "Customer Refills", description: "Edit customer refill job details" },
  { key: "customerRefills.receive", name: "Receive Customer Items", module: "Customer Refills", description: "Receive customer-owned fire extinguishers for refill" },
  { key: "customerRefills.issueReplacement", name: "Issue Temporary Replacement", module: "Customer Refills", description: "Issue warehouse inventory as temporary replacements" },
  { key: "customerRefills.startRefill", name: "Start Customer Refill", module: "Customer Refills", description: "Mark customer refill job as in-progress" },
  { key: "customerRefills.complete", name: "Complete Customer Refill", module: "Customer Refills", description: "Complete refill job and return customer extinguishers" },
  { key: "customerRefills.returnReplacement", name: "Return Temporary Replacement", module: "Customer Refills", description: "Receive returned temporary replacement stock back to warehouse" },
  { key: "customerRefills.print", name: "Print Customer Refill Receipt", module: "Customer Refills", description: "Print customer refill receipts" },
  { key: "customerRefills.downloadPdf", name: "Download Customer Refill Receipt PDF", module: "Customer Refills", description: "Download PDF customer refill receipts" },

  // ── Audit & Notifications ──
  { key: "audit_log.view", name: "View Audit Log", module: "Audit Log", description: "View security audit trails and system logs" },
  { key: "notification.view", name: "View Notifications", module: "Notifications", description: "View in-app alerts and notifications" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  // SUPER_ADMIN receives all permissions — also bypassed dynamically at runtime via permissions.ts
  SUPER_ADMIN: [
    "project.view", "project.create", "project.edit", "project.delete", "project.complete",
    "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
    "stock.receive", "stock.issue", "stock.return", "stock.transfer", "stock.adjust", "stock.view_history",
    "material_request.view", "material_request.create", "material_request.edit", "material_request.submit", "material_request.approve", "material_request.reject", "material_request.cancel",
    "labour.view", "labour.create", "labour.edit", "labour.delete", "labour.assign_project", "labour.attendance", "labour.manage_cost",
    "project_staff.view", "project_staff.assign", "project_staff.release", "project_staff.attendance", "project_staff.manage_salary", "project_staff.manage_ot",
    "expiry.view", "expiry.manage", "expiry.quarantine", "expiry.report",
    "supplier.view", "supplier.create", "supplier.edit", "supplier.delete",
    "customer.view", "customer.create", "customer.edit", "customer.delete",
    "tool.view", "tool.create", "tool.edit", "tool.delete", "tool.assign", "tool.transfer", "tool.return",
    "project_transfer.view", "project_transfer.create", "project_transfer.approve", "project_transfer.complete", "project_transfer.cancel",
    "fire_extinguisher.view", "fire_extinguisher.assign", "fire_extinguisher.deliver", "fire_extinguisher.refill", "fire_extinguisher.return", "fire_extinguisher.manage",
    "customerRefills.view", "customerRefills.create", "customerRefills.edit", "customerRefills.receive", "customerRefills.issueReplacement", "customerRefills.startRefill", "customerRefills.complete", "customerRefills.returnReplacement", "customerRefills.print", "customerRefills.downloadPdf",
    "report.view", "report.project", "report.inventory", "report.financial",
    "user.view", "user.create", "user.edit", "user.delete",
    "role.view", "role.manage",
    "permission.view", "permission.manage",
    "audit_log.view", "notification.view",
  ],

  ADMIN: [
    "project.view", "project.create", "project.edit", "project.delete", "project.complete",
    "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
    "stock.receive", "stock.issue", "stock.return", "stock.transfer", "stock.adjust", "stock.view_history",
    "material_request.view", "material_request.create", "material_request.submit", "material_request.approve", "material_request.reject", "material_request.cancel",
    "labour.view", "labour.create", "labour.edit", "labour.delete", "labour.assign_project", "labour.attendance", "labour.manage_cost",
    "project_staff.view", "project_staff.assign", "project_staff.release", "project_staff.attendance", "project_staff.manage_salary", "project_staff.manage_ot",
    "expiry.view", "expiry.manage", "expiry.quarantine", "expiry.report",
    "tool.view", "tool.create", "tool.edit", "tool.delete", "tool.assign", "tool.transfer", "tool.return",
    "supplier.view", "supplier.create", "supplier.edit", "supplier.delete",
    "customer.view", "customer.create", "customer.edit", "customer.delete",
    "project_transfer.view", "project_transfer.create", "project_transfer.approve", "project_transfer.complete", "project_transfer.cancel",
    "fire_extinguisher.view", "fire_extinguisher.assign", "fire_extinguisher.deliver", "fire_extinguisher.refill", "fire_extinguisher.return", "fire_extinguisher.manage",
    "customerRefills.view", "customerRefills.create", "customerRefills.edit", "customerRefills.receive", "customerRefills.issueReplacement", "customerRefills.startRefill", "customerRefills.complete", "customerRefills.returnReplacement", "customerRefills.print", "customerRefills.downloadPdf",
    "report.view", "report.project", "report.inventory", "report.financial",
    "user.view", "user.create", "user.edit",
    "role.view", "role.manage",
    "audit_log.view", "notification.view",
  ],

  GENERAL_MANAGER: [
    "project.view", "project.create", "project.edit", "project.complete",
    "inventory.view",
    "stock.view_history", "stock.transfer",
    "material_request.view", "material_request.approve", "material_request.reject",
    "labour.view", "labour.manage_cost",
    "project_staff.view",
    "expiry.view", "expiry.report",
    "report.view", "report.project", "report.inventory", "report.financial",
    "tool.view", "supplier.view", "customer.view",
    "project_transfer.view", "project_transfer.approve",
    "fire_extinguisher.view",
    "audit_log.view", "notification.view",
  ],

  PROJECT_MANAGER: [
    "project.view", "project.edit",
    "material_request.view", "material_request.create", "material_request.edit", "material_request.submit",
    "project_staff.view", "project_staff.assign", "project_staff.release", "project_staff.attendance",
    "labour.view", "labour.assign_project", "labour.attendance",
    "tool.view", "tool.assign", "tool.transfer", "tool.return",
    "stock.view_history", "stock.transfer",
    "project_transfer.view", "project_transfer.create",
    "fire_extinguisher.view", "fire_extinguisher.assign", "fire_extinguisher.return",
    "expiry.view", "report.project", "notification.view",
  ],

  ENGINEER: [
    "project.view",
    "material_request.view", "material_request.create", "material_request.edit", "material_request.submit",
    "project_staff.view", "project_staff.attendance",
    "labour.view", "labour.attendance",
    "tool.view", "tool.assign", "tool.return",
    "stock.view_history",
    "project_transfer.view", "project_transfer.create",
    "fire_extinguisher.view",
    "expiry.view", "report.project", "notification.view",
  ],

  ACCOUNTANT: [
    "project.view",
    "report.view", "report.project", "report.inventory", "report.financial",
    "project_staff.view", "project_staff.manage_salary", "project_staff.manage_ot",
    "labour.view", "labour.manage_cost",
    "inventory.view", "stock.view_history",
    "supplier.view", "customer.view", "notification.view",
  ],

  USER: [
    "project.view",
    "inventory.view",
    "notification.view",
  ],
};

export async function seedPermissions(prisma: PrismaClient) {
  console.log("🔒 Seeding system permissions...");

  const permissionMap = new Map<string, number>();

  for (const perm of PERMISSION_DEFINITIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
      create: {
        key: perm.key,
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
    });
    permissionMap.set(record.key, record.id);
  }

  console.log(`  ✓ Upserted ${PERMISSION_DEFINITIONS.length} permission keys.`);

  let rolePermCount = 0;
  for (const [roleName, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = roleName as any;

    // Resolve permission IDs for this role (skip unknown keys)
    const permissionIds = keys
      .map((k) => permissionMap.get(k))
      .filter((id): id is number => id !== undefined);

    // Fast replace: clear existing + bulk insert in one transaction
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ role, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    rolePermCount += permissionIds.length;
  }

  console.log(`  ✓ Seeded ${rolePermCount} default role-permission mappings.`);
}
