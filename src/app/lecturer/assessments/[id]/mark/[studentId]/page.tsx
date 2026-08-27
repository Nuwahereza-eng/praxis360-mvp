import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MarkingWorkspace } from "./MarkingWorkspace";

export default async function MarkStudent({ params }: { params: { id: string; studentId: string } }) {
  const s = await requireRole("LECTURER");
  const [assessment, student, existing] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: params.id },
      include: { course: true, rubric: { include: { learningOutcome: true } } },
    }),
    prisma.user.findUnique({ where: { id: params.studentId } }),
    prisma.assessmentResult.findUnique({
      where: { assessmentId_studentId: { assessmentId: params.id, studentId: params.studentId } },
      include: { criterionResults: true },
    }),
  ]);
  if (!assessment || assessment.course.lecturerId !== s.sub) notFound();
  if (!student) notFound();

  const existingByCriterion = new Map((existing?.criterionResults || []).map((c) => [c.rubricCriterionId, c]));
  const rubricInit = assessment.rubric.map((r) => ({
    id: r.id,
    title: r.title,
    maxMarks: r.maxMarks,
    outcomeTitle: r.learningOutcome.title,
    score: existingByCriterion.get(r.id)?.score ?? 0,
    feedback: existingByCriterion.get(r.id)?.feedback ?? "",
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/lecturer/assessments/${assessment.id}`} className="link text-sm">← Back to assessment</Link>
        <h1 className="text-2xl font-bold mt-2">Marking: {student.firstName} {student.lastName}</h1>
        <p className="text-on-surface-variant text-sm">{assessment.title} • {assessment.course.name}</p>
      </div>
      <MarkingWorkspace
        assessmentId={assessment.id}
        studentId={student.id}
        totalMarks={assessment.totalMarks}
        rubric={rubricInit}
        initialFeedback={existing?.lecturerFeedback || ""}
        initialStatus={existing?.status || "PENDING"}
      />
    </div>
  );
}
