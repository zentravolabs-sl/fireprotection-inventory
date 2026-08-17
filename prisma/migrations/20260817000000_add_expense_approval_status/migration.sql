-- ============================================================
-- Migration: add_expense_approval_status
-- Adds ExpenseApprovalStatus enum and approval fields to
-- project_expense table. Existing rows default to APPROVED.
-- Also adds new notification types to NotificationType enum.
-- ============================================================

-- 1. Create the ExpenseApprovalStatus enum
CREATE TYPE "ExpenseApprovalStatus" AS ENUM ('APPROVED', 'PENDING_APPROVAL', 'REJECTED');

-- 2. Add approval columns to project_expense (all nullable/defaulted so existing rows are safe)
ALTER TABLE "project_expense"
  ADD COLUMN "approvalStatus" "ExpenseApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "approvedBy"     TEXT,
  ADD COLUMN "approvedAt"     TIMESTAMP(3),
  ADD COLUMN "approvalNote"   TEXT;

-- 3. Create index on approvalStatus for pending-queue queries
CREATE INDEX "project_expense_approvalStatus_idx" ON "project_expense"("approvalStatus");

-- 4. Add new notification types to the existing NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COST_THRESHOLD_PENDING_APPROVAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COST_THRESHOLD_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COST_THRESHOLD_REJECTED';
