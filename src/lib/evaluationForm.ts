import { prisma } from "@/lib/prisma";

/**
 * Returns the effective evaluation form for a course:
 * course-specific questions if any exist, otherwise the global template
 * (questions where courseId is null).
 */
export async function getEvaluationFormForCourse(courseId: string) {
  const courseQs = await prisma.evaluationQuestion.findMany({
    where: { courseId },
    orderBy: { orderIdx: "asc" },
  });
  if (courseQs.length > 0) return { questions: courseQs, source: "course" as const };
  const globalQs = await prisma.evaluationQuestion.findMany({
    where: { courseId: null },
    orderBy: { orderIdx: "asc" },
  });
  return { questions: globalQs, source: "global" as const };
}

export async function countRatingQuestionsForCourse(courseId: string) {
  const inCourse = await prisma.evaluationQuestion.count({
    where: { courseId, type: "RATING" },
  });
  if (inCourse > 0) return inCourse;
  return prisma.evaluationQuestion.count({
    where: { courseId: null, type: "RATING" },
  });
}
