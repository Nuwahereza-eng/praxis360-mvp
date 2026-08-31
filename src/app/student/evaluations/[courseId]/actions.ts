"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEvaluationFormForCourse } from "@/lib/evaluationForm";

export async function submitEvaluationAction(formData: FormData) {
  const s = await requireRole("STUDENT");
  const courseId = String(formData.get("courseId"));
  const { questions } = await getEvaluationFormForCourse(courseId);
  for (const q of questions) {
    const val = formData.get(`q_${q.id}`);
    if (val === null || val === "") continue;
    try {
      if (q.type === "RATING") {
        await prisma.evaluationResponse.create({
          data: { studentId: s.sub, courseId, questionId: q.id, rating: parseInt(String(val), 10) },
        });
      } else {
        const text = String(val).trim();
        if (!text) continue;
        await prisma.evaluationResponse.create({
          data: { studentId: s.sub, courseId, questionId: q.id, text },
        });
      }
    } catch {
      // unique violation — already submitted; ignore
    }
  }
  await prisma.notification.create({
    data: { userId: s.sub, title: "Evaluation submitted", message: "Thanks — your feedback has been recorded anonymously.", type: "EVALUATION" },
  });
  redirect("/student/evaluations?thanks=1");
}
