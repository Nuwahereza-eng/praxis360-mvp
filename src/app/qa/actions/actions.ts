"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createActionAction(formData: FormData) {
  await requireRole("QA");
  const departmentId = String(formData.get("departmentId") || "");
  await prisma.institutionalAction.create({
    data: {
      title: String(formData.get("title") || "").trim(),
      issueSummary: String(formData.get("issueSummary") || "").trim(),
      evidence: String(formData.get("evidence") || "").trim(),
      actionTaken: String(formData.get("actionTaken") || "").trim(),
      outcome: String(formData.get("outcome") || "").trim() || null,
      responsibleDepartmentId: departmentId || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/qa/actions");
}

export async function publishToggleAction(formData: FormData) {
  await requireRole("QA");
  const id = String(formData.get("id"));
  const a = await prisma.institutionalAction.findUnique({ where: { id } });
  if (!a) return;
  await prisma.institutionalAction.update({ where: { id }, data: { published: !a.published } });
  revalidatePath("/qa/actions");
  revalidatePath("/student/you-said");
}

export async function updateStatusAction(formData: FormData) {
  await requireRole("QA");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.institutionalAction.update({
    where: { id },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  revalidatePath("/qa/actions");
  revalidatePath("/student/you-said");
}
