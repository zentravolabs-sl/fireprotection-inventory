-- Remove stale `unit` column from inventory table.
-- This column was removed from the Prisma schema but was never
-- dropped from the database, causing P2011 NullConstraintViolation
-- on every inventory.create() call since the DB enforced NOT NULL.
ALTER TABLE "inventory" DROP COLUMN IF EXISTS "unit";
