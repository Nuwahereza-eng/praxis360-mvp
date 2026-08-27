import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, ProgressBar } from "@/components/ui";

export default async function QALearning() {
  await requireRole("QA");
  const [total, byStatus, byLO] = await Promise.all([
    prisma.learningGap.count(),
    prisma.learningGap.groupBy({ by: ["status"], _count: true }),
    prisma.learningGap.groupBy({ by: ["learningOutcomeId"], _count: true, orderBy: { _count: { learningOutcomeId: "desc" } } }),
  ]);
  const los = await prisma.learningOutcome.findMany({ include: { course: true } });
  const map = new Map(los.map((l) => [l.id, `${l.title} (${l.course.name})`] as const));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learning Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total gaps" value={total} />
        {byStatus.map((b) => <KPI key={b.status} label={b.status} value={b._count as any} />)}
      </div>
      <div className="card-p">
        <div className="section-title mb-3">Most affected learning outcomes</div>
        <div className="space-y-3">
          {byLO.slice(0, 10).map((l) => (
            <div key={l.learningOutcomeId}>
              <div className="flex items-center justify-between text-sm"><span>{map.get(l.learningOutcomeId) || l.learningOutcomeId}</span><span>{l._count as any}</span></div>
              <ProgressBar value={(Number(l._count) / total) * 100} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
