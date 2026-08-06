// ============================================================
// src/types/project.ts
// Domain Types & Interfaces for Fire Protection ERP Project Module
// ============================================================

export type ProjectStatus =
  | "PENDING"
  | "MATERIAL_REQUEST"
  | "MATERIAL_APPROVED"
  | "MATERIAL_ISSUED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MaterialRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PARTIAL"
  | "ISSUED";

export type ReturnCondition = "GOOD" | "DAMAGED" | "SCRAP";

export type ExpenseType = "MATERIAL" | "LABOUR" | "TRANSPORT" | "EQUIPMENT" | "OTHER";

export type TransportStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface CustomerSummary {
  id: number;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface ProjectAssignmentItem {
  id: number;
  projectId: number;
  projectManagerId: string;
  assignedDate: Date;
  assignedBy: string;
  projectManager?: UserSummary;
  assignedByUser?: UserSummary;
}

export interface ProjectEngineerItem {
  id: number;
  projectId: number;
  engineerId: string;
  isLead: boolean;
  assignedDate: Date;
  assignedBy: string;
  engineer?: UserSummary;
  assignedByUser?: UserSummary;
}

export interface ProjectExpenseItem {
  id: number;
  expenseNo: string;
  projectId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: Date;
  description?: string | null;
  referenceNo?: string | null;
  createdBy: string;
  createdAt: Date;
  createdByUser?: UserSummary;
}

export interface ProjectTransportItem {
  id: number;
  transportNo: string;
  projectId: number;
  transportDate: Date;
  vehicleNumber: string;
  driverName: string;
  transportCompany?: string | null;
  fromLocation: string;
  toLocation: string;
  fuelCost: number;
  vehicleHireCost: number;
  loadingCost: number;
  unloadingCost: number;
  otherCost: number;
  totalCost: number;
  remarks?: string | null;
  status: TransportStatus;
  createdBy: string;
  createdAt: Date;
  createdByUser?: UserSummary;
}

export interface ProjectCostBreakdown {
  projectValue: number;

  estimatedMaterialCost: number;
  estimatedLabourCost: number;
  estimatedTransportCost: number;
  estimatedEquipmentCost: number;
  estimatedOtherCost: number;
  estimatedTotalCost: number;

  actualMaterialCost: number;
  actualLabourCost: number;
  actualTransportCost: number;
  actualEquipmentCost: number;
  actualOtherCost: number;
  actualTotalCost: number;

  estimatedProfit: number;
  actualProfit: number;
  estimatedProfitMargin: number;
  actualProfitMargin: number;

  costVariance: number;
  budgetBalance: number;
  profitOrLoss: number;
  completionPercentage: number;
}

export interface MaterialRequestItemSummary {
  id: number;
  materialRequestId: number;
  inventoryId: number;
  qtyRequested: number;
  qtyApproved: number;
  qtyIssued: number;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
    brand?: string | null;
  };
}

export interface MaterialRequestSummary {
  id: number;
  requestNo: string;
  projectId: number;
  engineerId: string;
  requestDate: Date;
  status: MaterialRequestStatus;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
  engineer?: UserSummary;
  project?: {
    id: number;
    projectCode: string;
    projectName: string;
  };
  items: MaterialRequestItemSummary[];
}

export interface MaterialIssueItemSummary {
  id: number;
  materialIssueId: number;
  stockBatchId: number;
  inventoryId: number;
  qty: number;
  costPrice: number;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
  stockBatch?: {
    id: number;
    batchNo?: string | null;
    unitCost: number;
  };
}

export interface MaterialIssueSummary {
  id: number;
  issueNo: string;
  materialRequestId: number;
  warehouse?: string | null;
  issuedBy: string;
  issueDate: Date;
  createdAt: Date;
  issuedByUser?: UserSummary;
  materialRequest?: {
    id: number;
    requestNo: string;
    projectId: number;
  };
  items: MaterialIssueItemSummary[];
}

export interface ProjectMaterialSummary {
  id: number;
  projectId: number;
  inventoryId: number;
  materialIssueItemId: number;
  issuedQty: number;
  returnedQty: number;
  balanceQty: number;
  status: string;
  createdAt: Date;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
  materialIssueItem?: {
    id: number;
    stockBatch: {
      batchNo?: string | null;
      unitCost: number;
    };
  };
}

export interface MaterialReturnItemSummary {
  id: number;
  materialReturnId: number;
  projectMaterialId?: number | null;
  inventoryId: number;
  qtyReturned: number;
  condition: ReturnCondition;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
}

export interface MaterialReturnSummary {
  id: number;
  returnNo: string;
  projectId: number;
  engineerId: string;
  returnedDate: Date;
  remarks?: string | null;
  createdAt: Date;
  engineer?: UserSummary;
  items: MaterialReturnItemSummary[];
}

export interface ProjectWithDetails {
  id: number;
  projectCode: string;
  projectName: string;
  customerId: number;
  projectManagerId: string;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status: ProjectStatus;
  description?: string | null;

  projectValue: number;
  estimatedMaterialCost: number;
  estimatedLabourCost: number;
  estimatedTransportCost: number;
  estimatedEquipmentCost: number;
  estimatedOtherCost: number;
  estimatedTotalCost: number;

  createdAt: Date;
  updatedAt: Date;
  customer: CustomerSummary;
  projectManager: UserSummary;
  engineers?: ProjectEngineerItem[];
  assignments?: ProjectAssignmentItem[];
  materialRequests?: MaterialRequestSummary[];
  projectMaterials?: ProjectMaterialSummary[];
  materialReturns?: MaterialReturnSummary[];
  transports?: ProjectTransportItem[];
  expenses?: ProjectExpenseItem[];
  costBreakdown?: ProjectCostBreakdown;
}

export interface ProjectTimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  type:
    | "CREATED"
    | "ASSIGNMENT"
    | "REQUEST"
    | "APPROVED"
    | "ISSUED"
    | "RETURNED"
    | "TRANSPORT"
    | "EXPENSE"
    | "COMPLETED"
    | "STATUS";
  user?: string;
  statusBadge?: string;
}

export interface ProjectDashboardStats {
  activeProjects: number;
  pendingMaterialRequests: number;
  materialsIssuedToday: number;
  materialsReturnedToday: number;
  completedProjects: number;
  totalInventoryValue: number;
  totalProjectValue: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  totalEstimatedProfit: number;
  totalActualProfit: number;
}
