-- CreateEnum
CREATE TYPE "ProjectStaffRole" AS ENUM ('PROJECT_MANAGER', 'ENGINEER');

-- CreateEnum
CREATE TYPE "ProjectStaffStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateTable
CREATE TABLE "project_staff" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectStaffRole" NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedDate" TIMESTAMP(3),
    "status" "ProjectStaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "salaryCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_staff_projectId_idx" ON "project_staff"("projectId");

-- CreateIndex
CREATE INDEX "project_staff_userId_idx" ON "project_staff"("userId");

-- CreateIndex
CREATE INDEX "project_staff_status_idx" ON "project_staff"("status");

-- AddForeignKey
ALTER TABLE "project_staff" ADD CONSTRAINT "project_staff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_staff" ADD CONSTRAINT "project_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
