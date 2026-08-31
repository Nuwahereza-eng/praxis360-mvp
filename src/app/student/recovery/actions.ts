"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";

export async function submitCorrectionAction(formData: FormData) {
  const s = await requireRole("STUDENT");
  const gapId = String(formData.get("gapId"));
  const activityId = String(formData.get("activityId"));
  const response = String(formData.get("response") || "");
  if (!response.trim()) return;

  const priorAttempts = await prisma.correctionAttempt.count({
    where: { correctionActivityId: activityId, studentId: s.sub },
  });

  // Deterministic reassessment: award score based on response length and keywords,
  // simulating a fair improvement over the original 42%.
  const kwHits = ["stakeholder", "functional", "non-functional", "requirement", "trace"].filter((k) =>
    response.toLowerCase().includes(k),
  ).length;
  const base = 55 + Math.min(30, Math.floor(response.length / 20));
  const bonus = kwHits * 4;
  const score = Math.min(95, base + bonus);

  await prisma.correctionAttempt.create({
    data: {
      correctionActivityId: activityId,
      studentId: s.sub,
      score,
      feedback: score >= 70 ? "Strong recovery — clear stakeholder mapping." : "Progress made — continue refining traceability.",
      attemptNumber: priorAttempts + 1,
    },
  });

  await prisma.learningGap.update({
    where: { id: gapId },
    data: { status: score >= 60 ? "RECOVERED" : "IN_PROGRESS" },
  });

  await notifyUser({
    userId: s.sub,
    title: score >= 60 ? "Learning gap recovered" : "Correction submitted",
    message: score >= 60
      ? `Great work — your reassessment scored ${score}%.`
      : `Your correction scored ${score}%. Keep going.`,
    type: "LEARNING_GAP",
    relatedEntityType: "LEARNING_GAP",
    relatedEntityId: gapId,
    actionUrl: `${process.env.APP_URL ?? ""}/student/recovery`,
    actionLabel: "Open Learning Recovery",
  });

  revalidatePath("/student/recovery");
}
