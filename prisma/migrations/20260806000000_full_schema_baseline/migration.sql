-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'USER');

-- CreateEnum
CREATE TYPE "StockReceiveStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'RETURN', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('STOCK_RECEIVE', 'PROJECT', 'PIPE_CUT', 'RETURN', 'MANUAL');

-- CreateEnum
CREATE TYPE "PipeCutStatus" AS ENUM ('AVAILABLE', 'USED', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "ToolCondition" AS ENUM ('New', 'Good', 'Fair', 'Damaged', 'UnderRepair');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('Available', 'InUse', 'Maintenance', 'Lost', 'Retired');

-- CreateEnum
CREATE TYPE "ToolAssignmentStatus" AS ENUM ('ACTIVE', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ToolHistoryAction" AS ENUM ('ASSIGNED', 'RETURNED', 'REPAIR', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'MATERIAL_REQUEST', 'MATERIAL_APPROVED', 'MATERIAL_ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PARTIAL', 'ISSUED');

-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('GOOD', 'DAMAGED', 'SCRAP');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('MATERIAL', 'LABOUR', 'TRANSPORT', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TransportStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeCode" TEXT,
    "phone" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "rackLocation" TEXT,
    "warehouse" TEXT,
    "defaultSellPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receive" (
    "id" SERIAL NOT NULL,
    "receiveNo" TEXT NOT NULL,
    "receiveDate" TIMESTAMP(3) NOT NULL,
    "referenceNo" TEXT,
    "remarks" TEXT,
    "status" "StockReceiveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "receivedBy" TEXT NOT NULL,

    CONSTRAINT "stock_receive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_receive_item" (
    "id" SERIAL NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "batchNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "stockReceiveId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,

    CONSTRAINT "stock_receive_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_batch" (
    "id" SERIAL NOT NULL,
    "batchNo" TEXT,
    "receivedQty" DOUBLE PRECISION NOT NULL,
    "availableQty" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "receiveDate" TIMESTAMP(3) NOT NULL,
    "rackLocation" TEXT,
    "warehouse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "stockReceiveItemId" INTEGER NOT NULL,

    CONSTRAINT "stock_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" SERIAL NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "referenceType" "ReferenceType" NOT NULL,
    "referenceId" INTEGER,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryId" INTEGER NOT NULL,
    "stockBatchId" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipe_cut_piece" (
    "id" SERIAL NOT NULL,
    "parentLength" DOUBLE PRECISION NOT NULL,
    "pieceLength" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "barcode" TEXT,
    "rackLocation" TEXT,
    "status" "PipeCutStatus" NOT NULL DEFAULT 'AVAILABLE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "stockBatchId" INTEGER NOT NULL,

    CONSTRAINT "pipe_cut_piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool" (
    "id" SERIAL NOT NULL,
    "toolCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "condition" "ToolCondition" NOT NULL,
    "status" "ToolStatus" NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "projectCode" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "projectManagerId" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "projectValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedLabourCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTransportCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedEquipmentCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedOtherCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTotalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "projectManagerId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "project_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_engineer" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "project_engineer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_expense" (
    "id" SERIAL NOT NULL,
    "expenseNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "referenceNo" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_transport" (
    "id" SERIAL NOT NULL,
    "transportNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "transportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "transportCompany" TEXT,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vehicleHireCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loadingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unloadingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "status" "TransportStatus" NOT NULL DEFAULT 'DELIVERED',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_request" (
    "id" SERIAL NOT NULL,
    "requestNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_request_item" (
    "id" SERIAL NOT NULL,
    "materialRequestId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "qtyRequested" DOUBLE PRECISION NOT NULL,
    "qtyApproved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyIssued" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "material_request_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issue" (
    "id" SERIAL NOT NULL,
    "issueNo" TEXT NOT NULL,
    "materialRequestId" INTEGER NOT NULL,
    "warehouse" TEXT,
    "issuedBy" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issue_item" (
    "id" SERIAL NOT NULL,
    "materialIssueId" INTEGER NOT NULL,
    "stockBatchId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "material_issue_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_material" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "materialIssueItemId" INTEGER NOT NULL,
    "issuedQty" DOUBLE PRECISION NOT NULL,
    "returnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceQty" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_return" (
    "id" SERIAL NOT NULL,
    "returnNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" TEXT NOT NULL,
    "returnedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_return_item" (
    "id" SERIAL NOT NULL,
    "materialReturnId" INTEGER NOT NULL,
    "projectMaterialId" INTEGER,
    "inventoryId" INTEGER NOT NULL,
    "qtyReturned" DOUBLE PRECISION NOT NULL,
    "condition" "ReturnCondition" NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "material_return_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_assignment" (
    "id" SERIAL NOT NULL,
    "assignmentNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" TEXT NOT NULL,
    "assignDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "remarks" TEXT,
    "status" "ToolAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_assignment_item" (
    "id" SERIAL NOT NULL,
    "toolAssignmentId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,
    "conditionAtIssue" "ToolCondition" NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "returnCondition" "ToolCondition",
    "remarks" TEXT,

    CONSTRAINT "tool_assignment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_history" (
    "id" SERIAL NOT NULL,
    "toolId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "engineerId" TEXT,
    "action" "ToolHistoryAction" NOT NULL,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_employeeCode_key" ON "user"("employeeCode");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_isActive_idx" ON "user"("isActive");

-- CreateIndex
CREATE INDEX "user_employeeCode_idx" ON "user"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_token_idx" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "category_categoryName_key" ON "category"("categoryName");

-- CreateIndex
CREATE INDEX "category_categoryName_idx" ON "category"("categoryName");

-- CreateIndex
CREATE INDEX "sub_category_categoryId_idx" ON "sub_category"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sub_category_categoryId_name_key" ON "sub_category"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_company_key" ON "supplier"("company");

-- CreateIndex
CREATE INDEX "supplier_company_idx" ON "supplier"("company");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_itemCode_key" ON "inventory"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_barcode_key" ON "inventory"("barcode");

-- CreateIndex
CREATE INDEX "inventory_itemCode_idx" ON "inventory"("itemCode");

-- CreateIndex
CREATE INDEX "inventory_barcode_idx" ON "inventory"("barcode");

-- CreateIndex
CREATE INDEX "inventory_categoryId_idx" ON "inventory"("categoryId");

-- CreateIndex
CREATE INDEX "inventory_subCategoryId_idx" ON "inventory"("subCategoryId");

-- CreateIndex
CREATE INDEX "inventory_name_idx" ON "inventory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_receive_receiveNo_key" ON "stock_receive"("receiveNo");

-- CreateIndex
CREATE INDEX "stock_receive_supplierId_idx" ON "stock_receive"("supplierId");

-- CreateIndex
CREATE INDEX "stock_receive_receiveDate_idx" ON "stock_receive"("receiveDate");

-- CreateIndex
CREATE INDEX "stock_receive_status_idx" ON "stock_receive"("status");

-- CreateIndex
CREATE INDEX "stock_receive_item_stockReceiveId_idx" ON "stock_receive_item"("stockReceiveId");

-- CreateIndex
CREATE INDEX "stock_receive_item_inventoryId_idx" ON "stock_receive_item"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_batch_stockReceiveItemId_key" ON "stock_batch"("stockReceiveItemId");

-- CreateIndex
CREATE INDEX "stock_batch_inventoryId_idx" ON "stock_batch"("inventoryId");

-- CreateIndex
CREATE INDEX "stock_batch_batchNo_idx" ON "stock_batch"("batchNo");

-- CreateIndex
CREATE INDEX "stock_batch_receiveDate_idx" ON "stock_batch"("receiveDate");

-- CreateIndex
CREATE INDEX "stock_movement_inventoryId_idx" ON "stock_movement"("inventoryId");

-- CreateIndex
CREATE INDEX "stock_movement_stockBatchId_idx" ON "stock_movement"("stockBatchId");

-- CreateIndex
CREATE INDEX "stock_movement_movementType_idx" ON "stock_movement"("movementType");

-- CreateIndex
CREATE INDEX "stock_movement_referenceType_idx" ON "stock_movement"("referenceType");

-- CreateIndex
CREATE INDEX "stock_movement_createdBy_idx" ON "stock_movement"("createdBy");

-- CreateIndex
CREATE INDEX "stock_movement_createdAt_idx" ON "stock_movement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pipe_cut_piece_barcode_key" ON "pipe_cut_piece"("barcode");

-- CreateIndex
CREATE INDEX "pipe_cut_piece_inventoryId_idx" ON "pipe_cut_piece"("inventoryId");

-- CreateIndex
CREATE INDEX "pipe_cut_piece_stockBatchId_idx" ON "pipe_cut_piece"("stockBatchId");

-- CreateIndex
CREATE INDEX "pipe_cut_piece_barcode_idx" ON "pipe_cut_piece"("barcode");

-- CreateIndex
CREATE INDEX "pipe_cut_piece_status_idx" ON "pipe_cut_piece"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tool_toolCode_key" ON "tool"("toolCode");

-- CreateIndex
CREATE UNIQUE INDEX "tool_serialNo_key" ON "tool"("serialNo");

-- CreateIndex
CREATE INDEX "tool_toolCode_idx" ON "tool"("toolCode");

-- CreateIndex
CREATE INDEX "tool_name_idx" ON "tool"("name");

-- CreateIndex
CREATE INDEX "tool_serialNo_idx" ON "tool"("serialNo");

-- CreateIndex
CREATE INDEX "tool_status_idx" ON "tool"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_companyName_key" ON "customer"("companyName");

-- CreateIndex
CREATE INDEX "customer_companyName_idx" ON "customer"("companyName");

-- CreateIndex
CREATE INDEX "customer_contactPerson_idx" ON "customer"("contactPerson");

-- CreateIndex
CREATE INDEX "customer_phone_idx" ON "customer"("phone");

-- CreateIndex
CREATE INDEX "customer_email_idx" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "project_projectCode_key" ON "project"("projectCode");

-- CreateIndex
CREATE INDEX "project_projectCode_idx" ON "project"("projectCode");

-- CreateIndex
CREATE INDEX "project_customerId_idx" ON "project"("customerId");

-- CreateIndex
CREATE INDEX "project_projectManagerId_idx" ON "project"("projectManagerId");

-- CreateIndex
CREATE INDEX "project_status_idx" ON "project"("status");

-- CreateIndex
CREATE INDEX "project_assignment_projectId_idx" ON "project_assignment"("projectId");

-- CreateIndex
CREATE INDEX "project_assignment_projectManagerId_idx" ON "project_assignment"("projectManagerId");

-- CreateIndex
CREATE INDEX "project_assignment_assignedBy_idx" ON "project_assignment"("assignedBy");

-- CreateIndex
CREATE INDEX "project_engineer_projectId_idx" ON "project_engineer"("projectId");

-- CreateIndex
CREATE INDEX "project_engineer_engineerId_idx" ON "project_engineer"("engineerId");

-- CreateIndex
CREATE INDEX "project_engineer_assignedBy_idx" ON "project_engineer"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "project_engineer_projectId_engineerId_key" ON "project_engineer"("projectId", "engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "project_expense_expenseNo_key" ON "project_expense"("expenseNo");

-- CreateIndex
CREATE INDEX "project_expense_expenseNo_idx" ON "project_expense"("expenseNo");

-- CreateIndex
CREATE INDEX "project_expense_projectId_idx" ON "project_expense"("projectId");

-- CreateIndex
CREATE INDEX "project_expense_expenseType_idx" ON "project_expense"("expenseType");

-- CreateIndex
CREATE INDEX "project_expense_expenseDate_idx" ON "project_expense"("expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "project_transport_transportNo_key" ON "project_transport"("transportNo");

-- CreateIndex
CREATE INDEX "project_transport_transportNo_idx" ON "project_transport"("transportNo");

-- CreateIndex
CREATE INDEX "project_transport_projectId_idx" ON "project_transport"("projectId");

-- CreateIndex
CREATE INDEX "project_transport_transportDate_idx" ON "project_transport"("transportDate");

-- CreateIndex
CREATE INDEX "project_transport_status_idx" ON "project_transport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "material_request_requestNo_key" ON "material_request"("requestNo");

-- CreateIndex
CREATE INDEX "material_request_requestNo_idx" ON "material_request"("requestNo");

-- CreateIndex
CREATE INDEX "material_request_projectId_idx" ON "material_request"("projectId");

-- CreateIndex
CREATE INDEX "material_request_engineerId_idx" ON "material_request"("engineerId");

-- CreateIndex
CREATE INDEX "material_request_status_idx" ON "material_request"("status");

-- CreateIndex
CREATE INDEX "material_request_item_materialRequestId_idx" ON "material_request_item"("materialRequestId");

-- CreateIndex
CREATE INDEX "material_request_item_inventoryId_idx" ON "material_request_item"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "material_issue_issueNo_key" ON "material_issue"("issueNo");

-- CreateIndex
CREATE INDEX "material_issue_issueNo_idx" ON "material_issue"("issueNo");

-- CreateIndex
CREATE INDEX "material_issue_materialRequestId_idx" ON "material_issue"("materialRequestId");

-- CreateIndex
CREATE INDEX "material_issue_issuedBy_idx" ON "material_issue"("issuedBy");

-- CreateIndex
CREATE INDEX "material_issue_item_materialIssueId_idx" ON "material_issue_item"("materialIssueId");

-- CreateIndex
CREATE INDEX "material_issue_item_stockBatchId_idx" ON "material_issue_item"("stockBatchId");

-- CreateIndex
CREATE INDEX "material_issue_item_inventoryId_idx" ON "material_issue_item"("inventoryId");

-- CreateIndex
CREATE INDEX "project_material_projectId_idx" ON "project_material"("projectId");

-- CreateIndex
CREATE INDEX "project_material_inventoryId_idx" ON "project_material"("inventoryId");

-- CreateIndex
CREATE INDEX "project_material_materialIssueItemId_idx" ON "project_material"("materialIssueItemId");

-- CreateIndex
CREATE INDEX "project_material_status_idx" ON "project_material"("status");

-- CreateIndex
CREATE UNIQUE INDEX "material_return_returnNo_key" ON "material_return"("returnNo");

-- CreateIndex
CREATE INDEX "material_return_returnNo_idx" ON "material_return"("returnNo");

-- CreateIndex
CREATE INDEX "material_return_projectId_idx" ON "material_return"("projectId");

-- CreateIndex
CREATE INDEX "material_return_engineerId_idx" ON "material_return"("engineerId");

-- CreateIndex
CREATE INDEX "material_return_item_materialReturnId_idx" ON "material_return_item"("materialReturnId");

-- CreateIndex
CREATE INDEX "material_return_item_projectMaterialId_idx" ON "material_return_item"("projectMaterialId");

-- CreateIndex
CREATE INDEX "material_return_item_inventoryId_idx" ON "material_return_item"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_assignment_assignmentNo_key" ON "tool_assignment"("assignmentNo");

-- CreateIndex
CREATE INDEX "tool_assignment_projectId_idx" ON "tool_assignment"("projectId");

-- CreateIndex
CREATE INDEX "tool_assignment_engineerId_idx" ON "tool_assignment"("engineerId");

-- CreateIndex
CREATE INDEX "tool_assignment_status_idx" ON "tool_assignment"("status");

-- CreateIndex
CREATE INDEX "tool_assignment_assignDate_idx" ON "tool_assignment"("assignDate");

-- CreateIndex
CREATE INDEX "tool_assignment_item_toolAssignmentId_idx" ON "tool_assignment_item"("toolAssignmentId");

-- CreateIndex
CREATE INDEX "tool_assignment_item_toolId_idx" ON "tool_assignment_item"("toolId");

-- CreateIndex
CREATE INDEX "tool_history_toolId_idx" ON "tool_history"("toolId");

-- CreateIndex
CREATE INDEX "tool_history_projectId_idx" ON "tool_history"("projectId");

-- CreateIndex
CREATE INDEX "tool_history_engineerId_idx" ON "tool_history"("engineerId");

-- CreateIndex
CREATE INDEX "tool_history_action_idx" ON "tool_history"("action");

-- CreateIndex
CREATE INDEX "tool_history_createdAt_idx" ON "tool_history"("createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receive" ADD CONSTRAINT "stock_receive_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receive" ADD CONSTRAINT "stock_receive_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receive_item" ADD CONSTRAINT "stock_receive_item_stockReceiveId_fkey" FOREIGN KEY ("stockReceiveId") REFERENCES "stock_receive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receive_item" ADD CONSTRAINT "stock_receive_item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_stockReceiveItemId_fkey" FOREIGN KEY ("stockReceiveItemId") REFERENCES "stock_receive_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "stock_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipe_cut_piece" ADD CONSTRAINT "pipe_cut_piece_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipe_cut_piece" ADD CONSTRAINT "pipe_cut_piece_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "stock_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment" ADD CONSTRAINT "project_assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment" ADD CONSTRAINT "project_assignment_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment" ADD CONSTRAINT "project_assignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_engineer" ADD CONSTRAINT "project_engineer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_engineer" ADD CONSTRAINT "project_engineer_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_engineer" ADD CONSTRAINT "project_engineer_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expense" ADD CONSTRAINT "project_expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expense" ADD CONSTRAINT "project_expense_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_transport" ADD CONSTRAINT "project_transport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_transport" ADD CONSTRAINT "project_transport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request" ADD CONSTRAINT "material_request_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_item" ADD CONSTRAINT "material_request_item_materialRequestId_fkey" FOREIGN KEY ("materialRequestId") REFERENCES "material_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_item" ADD CONSTRAINT "material_request_item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue" ADD CONSTRAINT "material_issue_materialRequestId_fkey" FOREIGN KEY ("materialRequestId") REFERENCES "material_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue" ADD CONSTRAINT "material_issue_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_item" ADD CONSTRAINT "material_issue_item_materialIssueId_fkey" FOREIGN KEY ("materialIssueId") REFERENCES "material_issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_item" ADD CONSTRAINT "material_issue_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "stock_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_item" ADD CONSTRAINT "material_issue_item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_material" ADD CONSTRAINT "project_material_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_material" ADD CONSTRAINT "project_material_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_material" ADD CONSTRAINT "project_material_materialIssueItemId_fkey" FOREIGN KEY ("materialIssueItemId") REFERENCES "material_issue_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return" ADD CONSTRAINT "material_return_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return" ADD CONSTRAINT "material_return_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return_item" ADD CONSTRAINT "material_return_item_materialReturnId_fkey" FOREIGN KEY ("materialReturnId") REFERENCES "material_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return_item" ADD CONSTRAINT "material_return_item_projectMaterialId_fkey" FOREIGN KEY ("projectMaterialId") REFERENCES "project_material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_return_item" ADD CONSTRAINT "material_return_item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignment" ADD CONSTRAINT "tool_assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignment" ADD CONSTRAINT "tool_assignment_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignment_item" ADD CONSTRAINT "tool_assignment_item_toolAssignmentId_fkey" FOREIGN KEY ("toolAssignmentId") REFERENCES "tool_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignment_item" ADD CONSTRAINT "tool_assignment_item_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
