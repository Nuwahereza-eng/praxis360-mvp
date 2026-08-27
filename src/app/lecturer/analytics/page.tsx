import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, ProgressBar } from "@/components/ui";

export default async function LecturerAnalytics() {
  const s = await requireRole("LECTURER");
  const courses = await prisma.course.findMany({ where: { lecturerId: s.sub }, include: { learningOutcomes: true } });

  const perOutcome: { outcome: string; course: string; struggling: number; total: number }[] = [];
  for (const c of courses) {
    for (const lo of c.learningOutcomes) {
      const gaps = await prisma.learningGap.count({ where: { learningOutcomeId: lo.id } });
      const enrolled = await prisma.enrollment.count({ where: { courseId: c.id } });
      perOutcome.push({ outcome: lo.title, course: c.name, struggling: gaps, total: enrolled });
    }
  }

  const results = await prisma.assessmentResult.findMany({
    where: { assessment: { course: { lecturerId: s.sub } }, status: "RELEASED" },
    include: { assessment: true },
  });
  const avgByAssessment: Record<string, { title: string; scores: number[] }> = {};
  for (const r of results) {
    avgByAssessment[r.assessmentId] ??= { title: r.assessment.title, scores: [] };
    avgByAssessment[r.assessmentId].scores.push(r.percentage);
  }
  const avgList = Object.values(avgByAssessment).map((a) => ({
    title: a.title,
    avg: a.scores.reduce((s, x) => s + x, 0) / (a.scores.length || 1),
    n: a.scores.length,
  }));

  const recovered = await prisma.learningGap.count({ where: { course: { lecturerId: s.sub }, status: "RECOVERED" } });
  const totalGaps = await prisma.learningGap.count({ where: { course: { lecturerId: s.sub } } });
  const recoveryRate = totalGaps > 0 ? (recovered / totalGaps) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Assessments released" value={avgList.length} />
        <KPI label="Learning gaps" value={totalGaps} />
        <KPI label="Recovered" value={recovered} tone="success" />
        <KPI label="Recovery rate" value={`${recoveryRate.toFixed(0)}%`} tone={recoveryRate > 60 ? "success" : "warning"} />
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Learning outcomes with most difficulty</div>
        <div className="space-y-3">
          {perOutcome.filter((p) => p.struggling > 0).sort((a, b) => b.struggling - a.struggling).slice(0, 8).map((p) => (
            <div key={`${p.outcome}-${p.course}`}>
              <div className="flex items-center justify-between text-sm">
                <span><b>{p.outcome}</b> <span className="text-on-surface-variant">• {p.course}</span></span>
                <span className="text-on-surface-variant">{p.struggling} of {p.total} students</span>
              </div>
              <ProgressBar value={p.total > 0 ? (p.struggling / p.total) * 100 : 0} />
            </div>
          ))}
          {perOutcome.every((p) => p.struggling === 0) && <p className="text-sm text-on-surface-variant">No struggling outcomes detected.</p>}
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Assessment averages</div>
        <table className="table">
          <thead><tr><th>Assessment</th><th>Marked</th><th>Average</th></tr></thead>
          <tbody>
            {avgList.map((a) => (
              <tr key={a.title}><td>{a.title}</td><td>{a.n}</td><td>{a.avg.toFixed(0)}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
