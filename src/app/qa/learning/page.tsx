import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";
import { BarChart, DonutChart, Gauge, CHART_COLORS } from "@/components/Charts";

export default async function QALearning() {
  await requireRole("QA");
  const [total, byStatus, byLO] = await Promise.all([
    prisma.learningGap.count(),
    prisma.learningGap.groupBy({ by: ["status"], _count: true }),
    prisma.learningGap.groupBy({ by: ["learningOutcomeId"], _count: true, orderBy: { _count: { learningOutcomeId: "desc" } } }),
  ]);
  const los = await prisma.learningOutcome.findMany({ include: { course: true } });
  const map = new Map(los.map((l) => [l.id, `${l.title} (${l.course.name})`] as const));

  const statusMap = new Map(byStatus.map((b) => [b.status, Number(b._count)] as const));
  const recovered = statusMap.get("RECOVERED") || 0;
  const recoveryRate = total > 0 ? (recovered / total) * 100 : 0;

  const statusChart = [
    { label: "Identified", value: statusMap.get("IDENTIFIED") || 0, color: CHART_COLORS.error },
    { label: "In progress", value: statusMap.get("IN_PROGRESS") || 0, color: CHART_COLORS.warning },
    { label: "Reassessed", value: statusMap.get("REASSESSED") || 0, color: CHART_COLORS.info },
    { label: "Recovered", value: recovered, color: CHART_COLORS.success },
    { label: "Needs intervention", value: statusMap.get("NEEDS_INTERVENTION") || 0, color: "#7c3aed" },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learning Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total gaps" value={total} />
        {byStatus.map((b) => <KPI key={b.status} label={b.status} value={b._count as any} />)}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p md:col-span-2">
          <div className="section-title mb-3">Gap status distribution</div>
          {statusChart.length > 0 ? (
            <DonutChart data={statusChart} centerValue={total} centerLabel="gaps" />
          ) : (
            <p className="text-sm text-on-surface-variant">No gaps yet.</p>
          )}
        </div>
        <div className="card-p">
          <div className="section-title mb-3">Recovery rate</div>
          <Gauge value={recoveryRate} label={`${recovered} of ${total} recovered`} />
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Most affected learning outcomes</div>
        {byLO.length > 0 ? (
          <BarChart
            orientation="horizontal"
            data={byLO.slice(0, 10).map((l) => ({
              label: map.get(l.learningOutcomeId) || l.learningOutcomeId,
              value: Number(l._count),
              color: CHART_COLORS.warning,
            }))}
          />
        ) : (
          <p className="text-sm text-on-surface-variant">No gaps yet.</p>
        )}
      </div>
    </div>
  );
}
