"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTemplateAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!name) return;
  const t = await prisma.rubricTemplate.create({
    data: { name, description, ownerId: s.sub },
  });
  revalidatePath("/lecturer/rubrics");
  redirect(`/lecturer/rubrics/${t.id}`);
}

export async function deleteTemplateAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const id = String(formData.get("id") || "");
  const t = await prisma.rubricTemplate.findUnique({ where: { id } });
  if (!t || t.ownerId !== s.sub) return;
  await prisma.rubricTemplate.delete({ where: { id } });
  revalidatePath("/lecturer/rubrics");
}

export async function updateTemplateAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const t = await prisma.rubricTemplate.findUnique({ where: { id } });
  if (!t || t.ownerId !== s.sub || !name) return;
  await prisma.rubricTemplate.update({ where: { id }, data: { name, description } });
  revalidatePath(`/lecturer/rubrics/${id}`);
}

export async function addCriterionAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const templateId = String(formData.get("templateId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const maxMarks = Number(formData.get("maxMarks") || 10);
  const t = await prisma.rubricTemplate.findUnique({ where: { id: templateId } });
  if (!t || t.ownerId !== s.sub || !title) return;
  const count = await prisma.rubricTemplateCriterion.count({ where: { templateId } });
  await prisma.rubricTemplateCriterion.create({
    data: { templateId, title, description, maxMarks: Math.max(1, maxMarks), orderIdx: count },
  });
  revalidatePath(`/lecturer/rubrics/${templateId}`);
}

export async function deleteCriterionAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const id = String(formData.get("id") || "");
  const c = await prisma.rubricTemplateCriterion.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!c || c.template.ownerId !== s.sub) return;
  await prisma.rubricTemplateCriterion.delete({ where: { id } });
  revalidatePath(`/lecturer/rubrics/${c.templateId}`);
}

export async function applyTemplateToAssessmentAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const templateId = String(formData.get("templateId") || "");
  const assessmentId = String(formData.get("assessmentId") || "");
  const replaceExisting = formData.get("replaceExisting") === "on";

  const [template, assessment] = await Promise.all([
    prisma.rubricTemplate.findUnique({
      where: { id: templateId },
      include: { criteria: { orderBy: { orderIdx: "asc" } } },
    }),
    prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: { include: { learningOutcomes: { orderBy: { title: "asc" } } } } },
    }),
  ]);
  if (!template || !assessment) return;
  if (assessment.course.lecturerId !== s.sub) return;
  const los = assessment.course.learningOutcomes;
  if (los.length === 0) return;

  if (replaceExisting) {
    await prisma.rubricCriterion.deleteMany({ where: { assessmentId } });
  }

  await prisma.$transaction(
    template.criteria.map((c, i) =>
      prisma.rubricCriterion.create({
        data: {
          assessmentId,
          learningOutcomeId: los[i % los.length].id,
          title: c.title,
          description: c.description || "",
          maxMarks: c.maxMarks,
        },
      })
    )
  );
  revalidatePath(`/lecturer/assessments/${assessmentId}`);
}
