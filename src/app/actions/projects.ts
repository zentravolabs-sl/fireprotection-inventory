"use server";

// ============================================================
// src/app/actions/projects.ts
// Server Actions for Projects & Multi-Engineer Management
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  assignEngineerSchema,
  updateProjectCostsSchema,
} from "@/lib/validations/project";
import {
  createProjectService,
  assignEngineerService,
  removeEngineerService,
  setLeadEngineerService,
  updateProjectCostsService,
  updateProjectStatusService,
  completeProjectService,
} from "@/lib/services/projectService";
import { deleteProject } from "@/lib/repositories/projectRepository";
import { ProjectStatus } from "@/types/project";
import { requirePermission, requireProjectPermission } from "@/lib/auth/permissions";

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (err) {
    // Fallback to active admin user for resilience
  }

  const defaultUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return defaultUser?.id || "system";
}

export async function createProjectAction(formData: FormData) {
  try {
    const user = await requirePermission("project.create");
    const actorId = user.id;

    const raw = {
      projectName: formData.get("projectName"),
      customerId: Number(formData.get("customerId")),
      projectManagerId: formData.get("projectManagerId"),
      projectType: formData.get("projectType") || "PRIVATE",
      location: formData.get("location") || undefined,
      startDate: formData.get("startDate") || undefined,
      endDate: formData.get("endDate") || undefined,
      description: formData.get("description") || undefined,
      projectValue: Number(formData.get("projectValue") || 0),
      estimatedMaterialCost: Number(formData.get("estimatedMaterialCost") || 0),
      estimatedLabourCost: Number(formData.get("estimatedLabourCost") || 0),
      estimatedTransportCost: Number(formData.get("estimatedTransportCost") || 0),
      estimatedEquipmentCost: Number(formData.get("estimatedEquipmentCost") || 0),
      estimatedOtherCost: Number(formData.get("estimatedOtherCost") || 0),
    };

    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid project data",
      };
    }

    const project = await createProjectService(parsed.data, actorId);

    revalidatePath("/projects");
    return {
      success: true,
      message: `Project ${project.projectCode} created successfully!`,
      data: project,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to create project",
    };
  }
}

export async function assignEngineerAction(formData: FormData) {
  try {
    const actorId = await getActorId();

    const raw = {
      projectId: Number(formData.get("projectId")),
      engineerId: formData.get("engineerId"),
      isLead: formData.get("isLead") === "true" || formData.get("isLead") === "on",
    };

    const parsed = assignEngineerSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid engineer assignment data",
      };
    }

    const assignment = await assignEngineerService(parsed.data, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return {
      success: true,
      message: "Engineer assigned successfully!",
      data: assignment,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to assign engineer",
    };
  }
}

export const assignStaffAction = assignEngineerAction;

export async function removeEngineerAction(projectId: number, engineerId: string) {
  try {
    await removeEngineerService(projectId, engineerId);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return {
      success: true,
      message: "Engineer removed from project successfully.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to remove engineer",
    };
  }
}

export async function setLeadEngineerAction(projectId: number, engineerId: string) {
  try {
    await setLeadEngineerService(projectId, engineerId);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return {
      success: true,
      message: "Lead engineer updated successfully.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to set lead engineer",
    };
  }
}

export async function updateProjectCostsAction(formData: FormData) {
  try {
    const raw = {
      projectId: Number(formData.get("projectId")),
      projectValue: Number(formData.get("projectValue") || 0),
      estimatedMaterialCost: Number(formData.get("estimatedMaterialCost") || 0),
      estimatedLabourCost: Number(formData.get("estimatedLabourCost") || 0),
      estimatedTransportCost: Number(formData.get("estimatedTransportCost") || 0),
      estimatedEquipmentCost: Number(formData.get("estimatedEquipmentCost") || 0),
      estimatedOtherCost: Number(formData.get("estimatedOtherCost") || 0),
    };

    const parsed = updateProjectCostsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid cost estimation data",
      };
    }

    const updated = await updateProjectCostsService(parsed.data);

    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return {
      success: true,
      message: "Project estimated costs updated successfully!",
      data: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to update project costs",
    };
  }
}

export async function updateProjectStatusAction(projectId: number, status: ProjectStatus) {
  try {
    const updated = await updateProjectStatusService(projectId, status);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return {
      success: true,
      message: `Project status updated to ${status}.`,
      data: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to update project status",
    };
  }
}

export async function completeProjectAction(projectId: number) {
  try {
    const user = await requireProjectPermission("project.complete", projectId);
    const actorId = user.id;
    const updated = await completeProjectService(projectId, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return {
      success: true,
      message: `Project ${updated.projectCode} completed successfully!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to complete project",
    };
  }
}

export async function deleteProjectAction(projectId: number) {
  try {
    await requirePermission("project.delete");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        materialRequests: true,
        projectMaterials: true,
      },
    });

    if (!project) {
      return { success: false, message: "Project not found" };
    }

    if (project.status === "COMPLETED") {
      return { success: false, message: "Cannot delete a completed project." };
    }

    if (project.projectMaterials.length > 0) {
      return {
        success: false,
        message: "Cannot delete project with issued materials.",
      };
    }

    await deleteProject(projectId);

    revalidatePath("/projects");
    return {
      success: true,
      message: `Project ${project.projectCode} deleted successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to delete project",
    };
  }
}
