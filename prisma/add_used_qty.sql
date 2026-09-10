-- Add usedQty column to project_material table
-- Records actual quantity consumed/installed on site (separate from issued/balance)
ALTER TABLE "project_material" ADD COLUMN IF NOT EXISTS "usedQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
