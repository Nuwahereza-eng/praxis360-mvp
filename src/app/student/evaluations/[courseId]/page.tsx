import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { submitEvaluationAction } from "./actions";

export default async function EvaluateCourse({ params }: { params: { courseId: string } }) {
  const s = await requireRole("STUDENT");
  const enrolled = await prisma.enrollment.findFirst({ where: { studentId: s.sub, courseId: params.courseId } });
  if (!enrolled) notFound();

  const semester = await prisma.semester.findFirst({ where: { status: "ACTIVE" } });
  const now = new Date();
  if (!semester || semester.evaluationStartDate > now || semester.evaluationEndDate < now) {
    redirect("/student/evaluations");
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  const questions = await prisma.evaluationQuestion.findMany({ orderBy: { orderIdx: "asc" } });
  const existing = await prisma.evaluationResponse.count({ where: { studentId: s.sub, courseId: params.courseId, question: { type: "RATING" } } });
  if (existing >= questions.filter((q) => q.type === "RATING").length) {
    redirect("/student/evaluations");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{course?.name}</h1>
        <p className="text-on-surface-variant text-sm">
          Anonymous — lecturers see aggregated results only after the evaluation period closes.
        </p>
      </div>
      <form action={submitEvaluationAction} className="space-y-4">
        <input type="hidden" name="courseId" value={params.courseId} />
        {questions.map((q, idx) => (
          <div key={q.id} className="card-p">
            <div className="text-sm font-semibold">{idx + 1}. {q.text}</div>
            {q.type === "RATING" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {[1,2,3,4,5].map((v) => (
                  <label key={v} className="border border-outline-variant rounded-lg px-3 py-1.5 cursor-pointer text-sm">
                    <input type="radio" name={`q_${q.id}`} value={v} required className="mr-1" /> {v}
                  </label>
                ))}
                <div className="text-xs text-on-surface-variant flex items-center gap-2 ml-2">1 = strongly disagree • 5 = strongly agree</div>
              </div>
            ) : (
              <textarea name={`q_${q.id}`} className="input mt-3" placeholder="Optional" />
            )}
          </div>
        ))}
        <button type="submit" className="btn-primary">Submit anonymously</button>
      </form>
    </div>
  );
}
