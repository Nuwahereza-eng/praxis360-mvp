"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { AIService } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";

export async function analyzeFeedbackAction(feedback: string) {
  return AIService.analyzeFeedback(feedback);
}

export async function saveMarkingAction(formData: FormData) {
  const s = await requireRole("LECTURER");
  const assessmentId = String(formData.get("assessmentId"));
  const studentId = String(formData.get("studentId"));
  const totalScore = Number(formData.get("totalScore") || 0);
  const percentage = Number(formData.get("percentage") || 0);
  const feedback = String(formData.get("feedback") || "");
  const action = String(formData.get("action"));
  const criteria = JSON.parse(String(formData.get("criteria") || "[]")) as { id: string; score: number; feedback: string }[];

  const a = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: true, rubric: { include: { learningOutcome: true } } } });
  if (!a || a.course.lecturerId !== s.sub) return;

  const status = action === "PUBLISH" ? "RELEASED" : "MARKED";

  const existing = await prisma.assessmentResult.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId } },
  });

  let resultId: string;
  if (existing) {
    resultId = existing.id;
    await prisma.assessmentResult.update({
      where: { id: existing.id },
      data: {
        score: totalScore,
        percentage,
        lecturerFeedback: feedback,
        status,
        feedbackReleasedAt: status === "RELEASED" ? new Date() : existing.feedbackReleasedAt,
      },
    });
    await prisma.criterionResult.deleteMany({ where: { assessmentResultId: existing.id } });
  } else {
    const created = await prisma.assessmentResult.create({
      data: {
        assessmentId, studentId,
        score: totalScore, percentage,
        lecturerFeedback: feedback, status,
        feedbackReleasedAt: status === "RELEASED" ? new Date() : null,
      },
    });
    resultId = created.id;
  }

  for (const c of criteria) {
    await prisma.criterionResult.create({
      data: { assessmentResultId: resultId, rubricCriterionId: c.id, score: c.score, feedback: c.feedback },
    });
  }

  // Learning gap detection: for each criterion under 50% of max, flag its outcome as gap.
  if (status === "RELEASED") {
    for (const c of criteria) {
      const rub = a.rubric.find((r) => r.id === c.id);
      if (!rub) continue;
      const critPct = (c.score / rub.maxMarks) * 100;
      if (critPct < 50) {
        const exists = await prisma.learningGap.findFirst({
          where: { studentId, courseId: a.courseId, learningOutcomeId: rub.learningOutcomeId, sourceAssessmentId: assessmentId },
        });
        if (!exists) {
          await prisma.learningGap.create({
            data: {
              studentId,
              courseId: a.courseId,
              learningOutcomeId: rub.learningOutcomeId,
              sourceAssessmentId: assessmentId,
              severity: critPct < 40 ? "RED" : "AMBER",
              status: "IDENTIFIED",
            },
          });
        }
      }
    }
    await notifyUser({
      userId: studentId,
      title: "Feedback available",
      message: `Feedback for ${a.title} has been released.`,
      type: "FEEDBACK",
      relatedEntityType: "ASSESSMENT_RESULT",
      relatedEntityId: resultId,
      actionUrl: `${process.env.APP_URL ?? ""}/student/feedback/${resultId}`,
      actionLabel: "View feedback",
    });
  }

  revalidatePath(`/lecturer/assessments/${assessmentId}`);
  revalidatePath(`/lecturer/assessments/${assessmentId}/mark/${studentId}`);
}
