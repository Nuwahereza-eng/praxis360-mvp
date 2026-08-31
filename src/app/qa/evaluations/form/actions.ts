"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** courseId = "global" targets the shared template. */
function normalizeCourseId(raw: string): string | null {
  return raw === "global" ? null : raw;
}

async function nextOrderIdx(courseId: string | null) {
  const last = await prisma.evaluationQuestion.findFirst({
    where: { courseId },
    orderBy: { orderIdx: "desc" },
  });
  return (last?.orderIdx ?? -1) + 1;
}

export async function addEvaluationQuestion(formData: FormData) {
  await requireRole("QA");
  const scope = String(formData.get("scope") || "");
  const text = String(formData.get("text") || "").trim();
  const type = String(formData.get("type") || "RATING");
  if (!scope || !text) return;
  if (type !== "RATING" && type !== "TEXT") return;
  const courseId = normalizeCourseId(scope);
  const orderIdx = await nextOrderIdx(courseId);
  await prisma.evaluationQuestion.create({
    data: { text, type, orderIdx, courseId },
  });
  revalidatePath(`/qa/evaluations/form/${scope}`);
  revalidatePath("/qa/evaluations/form");
}

export async function updateEvaluationQuestion(formData: FormData) {
  await requireRole("QA");
  const id = String(formData.get("id") || "");
  const scope = String(formData.get("scope") || "");
  const text = String(formData.get("text") || "").trim();
  const type = String(formData.get("type") || "RATING");
  if (!id || !text) return;
  if (type !== "RATING" && type !== "TEXT") return;
  await prisma.evaluationQuestion.update({
    where: { id },
    data: { text, type },
  });
  revalidatePath(`/qa/evaluations/form/${scope}`);
}

export async function deleteEvaluationQuestion(formData: FormData) {
  await requireRole("QA");
  const id = String(formData.get("id") || "");
  const scope = String(formData.get("scope") || "");
  if (!id) return;
  // Detach any answered responses first so we don't violate the FK.
  await prisma.evaluationResponse.deleteMany({ where: { questionId: id } });
  await prisma.evaluationQuestion.delete({ where: { id } });
  revalidatePath(`/qa/evaluations/form/${scope}`);
}

export async function moveEvaluationQuestion(formData: FormData) {
  await requireRole("QA");
  const id = String(formData.get("id") || "");
  const scope = String(formData.get("scope") || "");
  const direction = String(formData.get("direction") || ""); // up | down
  if (!id || !scope) return;
  const courseId = normalizeCourseId(scope);
  const list = await prisma.evaluationQuestion.findMany({
    where: { courseId },
    orderBy: { orderIdx: "asc" },
  });
  const idx = list.findIndex((q) => q.id === id);
  if (idx === -1) return;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  const a = list[idx];
  const b = list[swapWith];
  await prisma.$transaction([
    prisma.evaluationQuestion.update({ where: { id: a.id }, data: { orderIdx: b.orderIdx } }),
    prisma.evaluationQuestion.update({ where: { id: b.id }, data: { orderIdx: a.orderIdx } }),
  ]);
  revalidatePath(`/qa/evaluations/form/${scope}`);
}

/** Copy every global question into a course-specific set. */
export async function cloneFromGlobal(formData: FormData) {
  await requireRole("QA");
  const scope = String(formData.get("scope") || "");
  const courseId = normalizeCourseId(scope);
  if (!courseId) return;
  const existing = await prisma.evaluationQuestion.count({ where: { courseId } });
  if (existing > 0) return; // safety: only clone when empty
  const globals = await prisma.evaluationQuestion.findMany({
    where: { courseId: null },
    orderBy: { orderIdx: "asc" },
  });
  if (globals.length === 0) return;
  await prisma.evaluationQuestion.createMany({
    data: globals.map((g, i) => ({
      text: g.text,
      type: g.type,
      orderIdx: i,
      courseId,
    })),
  });
  revalidatePath(`/qa/evaluations/form/${scope}`);
}

/** Remove all course-specific questions (and their responses) so the course falls back to the global template. */
export async function resetToGlobal(formData: FormData) {
  await requireRole("QA");
  const scope = String(formData.get("scope") || "");
  const courseId = normalizeCourseId(scope);
  if (!courseId) return;
  const qs = await prisma.evaluationQuestion.findMany({
    where: { courseId },
    select: { id: true },
  });
  const ids = qs.map((q) => q.id);
  if (ids.length > 0) {
    await prisma.evaluationResponse.deleteMany({ where: { questionId: { in: ids } } });
    await prisma.evaluationQuestion.deleteMany({ where: { id: { in: ids } } });
  }
  revalidatePath(`/qa/evaluations/form/${scope}`);
  redirect(`/qa/evaluations/form/${scope}`);
}
