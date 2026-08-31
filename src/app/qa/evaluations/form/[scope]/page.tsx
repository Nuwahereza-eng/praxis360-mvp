import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import {
  addEvaluationQuestion,
  updateEvaluationQuestion,
  deleteEvaluationQuestion,
  moveEvaluationQuestion,
  cloneFromGlobal,
  resetToGlobal,
} from "../actions";

export default async function QAEvaluationFormEditor({ params }: { params: { scope: string } }) {
  await requireRole("QA");
  const isGlobal = params.scope === "global";
  const courseId = isGlobal ? null : params.scope;

  let course: Awaited<ReturnType<typeof prisma.course.findUnique>> = null;
  if (!isGlobal) {
    course = await prisma.course.findUnique({
      where: { id: params.scope },
      include: { lecturer: true, department: true } as any,
    });
    if (!course) notFound();
  }

  const questions = await prisma.evaluationQuestion.findMany({
    where: { courseId },
    orderBy: { orderIdx: "asc" },
  });
  const globalCount = await prisma.evaluationQuestion.count({ where: { courseId: null } });
  const usesGlobal = !isGlobal && questions.length === 0;
  const responsesForThisScope = !isGlobal
    ? await prisma.evaluationResponse.count({
        where: { question: { courseId } },
      })
    : 0;

  const ratingCount = questions.filter((q) => q.type === "RATING").length;
  const textCount = questions.length - ratingCount;

  const scopeParam = params.scope;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-primary via-primary to-secondary text-on-primary shadow-card">
        <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">
          {isGlobal ? "🌐 Global template" : "🎯 Course-specific form"}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">
          {isGlobal ? "Default evaluation form" : (course as any)?.name}
        </h1>
        {!isGlobal && (course as any) && (
          <div className="text-xs opacity-90 mt-1">
            {(course as any).code} • {(course as any).lecturer?.firstName} {(course as any).lecturer?.lastName} • {(course as any).department?.name}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
            {ratingCount} rating • {textCount} comment
          </span>
          {usesGlobal && (
            <span className="inline-flex items-center gap-1 bg-white/25 px-2.5 py-1 rounded-full font-semibold">
              Currently using global template
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/qa/evaluations/form" className="btn-outline text-sm">← All forms</Link>
        {!isGlobal && usesGlobal && globalCount > 0 && (
          <form action={cloneFromGlobal}>
            <input type="hidden" name="scope" value={scopeParam} />
            <button className="btn-primary text-sm">Clone {globalCount} from global to customize</button>
          </form>
        )}
        {!isGlobal && !usesGlobal && (
          <form action={resetToGlobal}>
            <input type="hidden" name="scope" value={scopeParam} />
            <button
              className="btn-outline text-sm text-error border-error/40 hover:bg-error-container"
              formNoValidate
            >
              Reset to global (delete {questions.length} custom Q{questions.length === 1 ? "" : "s"})
            </button>
          </form>
        )}
      </div>

      {!isGlobal && !usesGlobal && responsesForThisScope > 0 && (
        <div className="card-p border-warning/40 bg-warning-container/60">
          <div className="text-sm">
            ⚠️ This form already has <strong>{responsesForThisScope}</strong> student response
            {responsesForThisScope === 1 ? "" : "s"}. Deleting or changing question meaning may distort the data.
          </div>
        </div>
      )}

      {!isGlobal && usesGlobal && (
        <div className="card-p border-info/30 bg-info-container/40">
          <div className="text-sm">
            🌐 This course currently uses the <strong>global template</strong>. Add a question below or clone from
            global to start customising.
          </div>
        </div>
      )}

      {/* Question list */}
      <div className="card-p">
        <div className="section-title mb-3">
          {isGlobal ? "Template questions" : usesGlobal ? "New custom questions" : "Custom questions"}
        </div>

        {questions.length === 0 ? (
          <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-lg p-6 text-center">
            No questions yet. Add one below.
          </div>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, idx) => (
              <li key={q.id} className="border border-outline-variant rounded-lg p-4">
                <form action={updateEvaluationQuestion} className="space-y-2">
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="scope" value={scopeParam} />
                  <div className="flex items-start gap-3">
                    <div className="text-xs font-bold text-on-surface-variant pt-2 w-6">#{idx + 1}</div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        name="text"
                        defaultValue={q.text}
                        required
                        rows={2}
                        className="input"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs text-on-surface-variant">Type:</label>
                        <select
                          name="type"
                          defaultValue={q.type}
                          className="input w-auto text-sm py-1"
                        >
                          <option value="RATING">Rating (1–5)</option>
                          <option value="TEXT">Comment (free text)</option>
                        </select>
                        <Badge
                          className={
                            q.type === "RATING"
                              ? "bg-info-container text-info"
                              : "bg-surface-container text-on-surface-variant"
                          }
                        >
                          {q.type === "RATING" ? "😐 1–5 scale" : "💬 Free text"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/50">
                    <div className="flex gap-1">
                      <MoveButton scope={scopeParam} id={q.id} direction="up" disabled={idx === 0} />
                      <MoveButton
                        scope={scopeParam}
                        id={q.id}
                        direction="down"
                        disabled={idx === questions.length - 1}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary text-sm">Save</button>
                    </div>
                  </div>
                </form>
                <form action={deleteEvaluationQuestion} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="scope" value={scopeParam} />
                  <button className="text-xs text-error hover:underline">Delete question</button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Add form */}
      <div className="card-p border-primary/30">
        <div className="section-title mb-3">Add question</div>
        <form action={addEvaluationQuestion} className="space-y-3">
          <input type="hidden" name="scope" value={scopeParam} />
          <div>
            <label className="label">Question text</label>
            <textarea
              name="text"
              required
              rows={2}
              className="input"
              placeholder="e.g. The lecturer used real-world examples effectively."
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input w-auto" defaultValue="RATING">
              <option value="RATING">Rating (1–5 face scale)</option>
              <option value="TEXT">Comment (free text)</option>
            </select>
          </div>
          <button className="btn-primary">Add question</button>
        </form>
      </div>
    </div>
  );
}

function MoveButton({
  scope,
  id,
  direction,
  disabled,
}: {
  scope: string;
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveEvaluationQuestion}>
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        disabled={disabled}
        className="btn-ghost text-sm px-2 py-1 disabled:opacity-30"
        title={direction === "up" ? "Move up" : "Move down"}
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}
