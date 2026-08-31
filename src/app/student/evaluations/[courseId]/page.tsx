import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { submitEvaluationAction } from "./actions";
import { getEvaluationFormForCourse } from "@/lib/evaluationForm";

const FACE_SCALE: { value: number; face: string; label: string; tone: string }[] = [
  { value: 1, face: "😞", label: "Strongly disagree", tone: "hover:bg-error-container hover:border-error/40" },
  { value: 2, face: "🙁", label: "Disagree", tone: "hover:bg-warning-container hover:border-warning/40" },
  { value: 3, face: "😐", label: "Neutral", tone: "hover:bg-surface-container hover:border-outline-variant" },
  { value: 4, face: "🙂", label: "Agree", tone: "hover:bg-info-container hover:border-info/40" },
  { value: 5, face: "😍", label: "Strongly agree", tone: "hover:bg-success-container hover:border-success/40" },
];

const QUICK_CHIPS = [
  "Explains clearly",
  "Well-prepared",
  "Approachable",
  "Fair marking",
  "Engaging",
  "Practical examples",
  "Needs faster feedback",
  "More practice tasks",
  "More real-world cases",
];

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
  const { questions } = await getEvaluationFormForCourse(params.courseId);
  const ratingQuestions = questions.filter((q) => q.type === "RATING");
  const commentQuestions = questions.filter((q) => q.type !== "RATING");
  const existing = await prisma.evaluationResponse.count({
    where: { studentId: s.sub, courseId: params.courseId, question: { type: "RATING" } },
  });
  if (existing >= ratingQuestions.length) {
    redirect("/student/evaluations?thanks=1");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-primary via-primary to-secondary text-on-primary shadow-card">
        <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">Anonymous evaluation</div>
        <h1 className="text-xl md:text-2xl font-bold mt-1">{course?.name}</h1>
        <div className="text-xs opacity-90 mt-1">{course?.code}</div>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">🔒 100% anonymous</span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">⏱ ~3 minutes</span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
            {ratingQuestions.length} quick ratings + optional comments
          </span>
        </div>
      </div>

      {/* Anonymity assurance */}
      <div className="card-p border-info/30 bg-info-container/40">
        <div className="flex items-start gap-3">
          <div className="text-xl">🛡️</div>
          <div className="text-sm">
            <div className="font-semibold">You are anonymous.</div>
            <div className="text-on-surface-variant text-xs mt-0.5">
              Lecturers only see aggregated results after the window closes. Ratings are not linked to your name, course grade, or attendance.
            </div>
          </div>
        </div>
      </div>

      <form action={submitEvaluationAction} className="space-y-4">
        <input type="hidden" name="courseId" value={params.courseId} />

        {ratingQuestions.map((q, idx) => (
          <div key={q.id} className="card-p" id={`q-${idx + 1}`}>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div className="text-sm font-semibold flex-1">
                <span className="text-primary mr-2">{idx + 1}/{ratingQuestions.length}</span>
                {q.text}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {FACE_SCALE.map((f) => (
                <label
                  key={f.value}
                  className={`face-option ${f.tone}`}
                  title={f.label}
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={f.value}
                    required
                    className="sr-only peer"
                  />
                  <div className="text-2xl md:text-3xl">{f.face}</div>
                  <div className="text-[10px] text-on-surface-variant mt-1 leading-tight text-center">
                    {f.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}

        {commentQuestions.length > 0 && (
          <div className="card-p space-y-4">
            <div className="section-title">Optional comments</div>
            <div className="text-xs text-on-surface-variant -mt-2">
              Tap a chip to add it, or write your own. Skip if you like — comments are optional.
            </div>
            {commentQuestions.map((q) => (
              <div key={q.id}>
                <div className="text-sm font-medium mb-2">{q.text}</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_CHIPS.map((chip) => (
                    <span
                      key={chip}
                      className="text-xs bg-surface-container border border-outline-variant rounded-full px-2.5 py-1 text-on-surface-variant"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <textarea
                  name={`q_${q.id}`}
                  className="input"
                  rows={3}
                  placeholder="Type your thoughts (optional)…"
                />
              </div>
            ))}
          </div>
        )}

        <div className="sticky bottom-4 z-10">
          <div className="card-p flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="text-xs text-on-surface-variant">
              Almost there — hit submit to lock in your anonymous ratings.
            </div>
            <div className="flex gap-2">
              <Link href="/student/evaluations" className="btn-ghost text-sm">Cancel</Link>
              <button type="submit" className="btn-primary">Submit anonymously ✓</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
