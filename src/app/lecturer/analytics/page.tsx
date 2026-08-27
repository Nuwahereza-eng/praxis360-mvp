import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";
import { BarChart, Gauge, CHART_COLORS } from "@/components/Charts";

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

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p md:col-span-2">
          <div className="section-title mb-3">Learning outcomes with most difficulty</div>
          {perOutcome.filter((p) => p.struggling > 0).length > 0 ? (
            <BarChart
              orientation="horizontal"
              data={perOutcome
                .filter((p) => p.struggling > 0)
                .sort((a, b) => b.struggling - a.struggling)
                .slice(0, 8)
                .map((p) => ({ label: `${p.outcome} • ${p.course}`, value: p.struggling, color: CHART_COLORS.warning }))}
              valueSuffix=" students"
            />
          ) : (
            <p className="text-sm text-on-surface-variant">No struggling outcomes detected.</p>
          )}
        </div>
        <div className="card-p">
          <div className="section-title mb-3">Recovery</div>
          <Gauge value={recoveryRate} label={`${recovered} of ${totalGaps} recovered`} />
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Assessment averages</div>
        {avgList.length > 0 ? (
          <BarChart
            data={avgList.map((a) => ({
              label: a.title,
              value: Math.round(a.avg),
              color: a.avg >= 70 ? CHART_COLORS.success : a.avg >= 50 ? CHART_COLORS.warning : CHART_COLORS.error,
            }))}
            valueSuffix="%"
            height={240}
          />
        ) : (
          <p className="text-sm text-on-surface-variant">No released assessments yet.</p>
        )}
      </div>
    </div>
  );
}
