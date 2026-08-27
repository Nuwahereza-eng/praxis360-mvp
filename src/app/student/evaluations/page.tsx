import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, ProgressBar } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default async function StudentEvaluations() {
  const s = await requireRole("STUDENT");
  const semester = await prisma.semester.findFirst({ where: { status: "ACTIVE" } });
  const now = new Date();
  const evalOpen = !!semester && semester.evaluationStartDate <= now && semester.evaluationEndDate >= now;
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: s.sub, semesterId: semester?.id },
    include: { course: { include: { lecturer: true } } },
  });
  const totalQuestions = await prisma.evaluationQuestion.count({ where: { type: "RATING" } });

  // Course-level completion + participation
  const perCourse = await Promise.all(
    enrollments.map(async (e) => {
      const answered = await prisma.evaluationResponse.count({
        where: { studentId: s.sub, courseId: e.courseId, question: { type: "RATING" } },
      });
      const totalEnrolled = await prisma.enrollment.count({ where: { courseId: e.courseId } });
      const participants = await prisma.evaluationResponse.findMany({
        where: { courseId: e.courseId }, select: { studentId: true }, distinct: ["studentId"],
      });
      const participationPct = totalEnrolled === 0 ? 0 : (participants.length / totalEnrolled) * 100;
      return { enrollment: e, answered, participationPct };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Voice Matters</h1>
        <p className="text-on-surface-variant text-sm">
          {evalOpen
            ? `Evaluations close on ${fmtDate(semester?.evaluationEndDate)}. Anonymous • 8 rating questions + 2 comments • ~3 minutes each.`
            : "Teaching evaluations are not currently open."}
        </p>
      </div>

      {!evalOpen && <div className="card-p">The evaluation window is closed.</div>}

      {evalOpen && perCourse.map(({ enrollment, answered, participationPct }) => {
        const done = answered >= totalQuestions;
        return (
          <div key={enrollment.id} className="card-p">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{enrollment.course.name}</div>
                <div className="text-xs text-on-surface-variant">
                  {enrollment.course.code} • Lecturer identity not shown until evaluation closes
                </div>
              </div>
              <Badge className={done ? "bg-success-container text-success" : "bg-warning-container text-warning"}>
                {done ? "Submitted" : "Pending"}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Class participation</span>
                <span>{Math.round(participationPct)}% • target 90%</span>
              </div>
              <ProgressBar value={participationPct} />
            </div>
            <div className="mt-4">
              {done ? (
                <span className="text-sm text-success font-medium">Thanks — your response has been recorded.</span>
              ) : (
                <Link href={`/student/evaluations/${enrollment.courseId}`} className="btn-primary">
                  Start evaluation
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
