import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai";
import { LoopSteps } from "@/components/ui";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function FeedbackDetail({ params }: { params: { id: string } }) {
  const s = await requireRole("STUDENT");
  const result = await prisma.assessmentResult.findUnique({
    where: { id: params.id },
    include: {
      assessment: { include: { course: true, rubric: { include: { learningOutcome: true } } } },
      criterionResults: { include: { rubricCriterion: { include: { learningOutcome: true } } } },
    },
  });
  if (!result || result.studentId !== s.sub) notFound();

  const explanation = AIService.explainFeedback(result.lecturerFeedback || "");
  const gap = await prisma.learningGap.findFirst({
    where: { studentId: s.sub, sourceAssessmentId: result.assessmentId },
    include: { activities: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/student/feedback" className="link text-sm">← Back to feedback</Link>
        <h1 className="text-2xl font-bold mt-2">{result.assessment.title}</h1>
        <p className="text-on-surface-variant text-sm">{result.assessment.course.name}</p>
      </div>

      <LoopSteps steps={["Given","Understood","Actioned","Verified"]} current={gap?.status === "RECOVERED" ? 3 : gap ? 2 : 1} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p">
          <div className="kpi-label">Your Score</div>
          <div className="kpi-value">{result.percentage.toFixed(0)}%</div>
        </div>
        <div className="card-p">
          <div className="kpi-label">Pass Mark</div>
          <div className="kpi-value">{result.assessment.passMark}%</div>
        </div>
        <div className="card-p">
          <div className="kpi-label">Total Marks</div>
          <div className="kpi-value">{result.assessment.totalMarks}</div>
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-2">Original Lecturer Feedback</div>
        <p className="text-on-surface bg-surface-container-low border border-outline-variant rounded-lg p-3 italic">
          &ldquo;{result.lecturerFeedback}&rdquo;
        </p>
      </div>

      <div className="card-p bg-info-container/40 border-info/30">
        <div className="flex items-center justify-between">
          <div className="section-title">Understand My Feedback</div>
          <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">AI-generated — review required</span>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div><div className="font-semibold">What your lecturer means</div><p>{explanation.meaning}</p></div>
          <div><div className="font-semibold">Why it matters</div><p>{explanation.whyItMatters}</p></div>
          <div><div className="font-semibold">What to improve</div><p>{explanation.whatToImprove}</p></div>
          <div><div className="font-semibold">What to do next</div>
            <ul className="list-disc pl-6 mt-1">{explanation.nextSteps.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </div>
      </div>

      {result.criterionResults.length > 0 && (
        <div className="card-p">
          <div className="section-title mb-3">Rubric Breakdown</div>
          <table className="table">
            <thead><tr><th>Criterion</th><th>Learning Outcome</th><th>Score</th><th>Notes</th></tr></thead>
            <tbody>
              {result.criterionResults.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.rubricCriterion.title}</td>
                  <td>{c.rubricCriterion.learningOutcome.title}</td>
                  <td>{c.score}/{c.rubricCriterion.maxMarks}</td>
                  <td className="text-on-surface-variant">{c.feedback || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {gap && (
        <div className="card-p bg-warning-container/40 border-warning/30">
          <div className="section-title">Learning gap identified</div>
          <p className="text-sm mt-1">
            We identified a gap on a learning outcome tied to this assessment. A recovery activity is available.
          </p>
          <Link href="/student/recovery" className="btn-primary mt-3">Go to Learning Recovery</Link>
        </div>
      )}
    </div>
  );
}
