import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";
import { DonutChart, BarChart, StackedBar, CHART_COLORS } from "@/components/Charts";

export default async function QAVoice() {
  await requireRole("QA");
  const [issues, byDept, byCategory, byStatus] = await Promise.all([
    prisma.issue.count(),
    prisma.issue.groupBy({ by: ["departmentId"], _count: true }),
    prisma.issue.groupBy({ by: ["category"], _count: true }),
    prisma.issue.groupBy({ by: ["status"], _count: true }),
  ]);
  const deptNames = await prisma.department.findMany({ select: { id: true, name: true } });
  const nameMap = new Map(deptNames.map((d) => [d.id, d.name] as const));

  const statusMap = new Map(byStatus.map((s) => [s.status, Number(s._count)] as const));
  const pipeline = [
    { label: "New", value: statusMap.get("SUBMITTED") || 0, color: CHART_COLORS.info },
    { label: "Received", value: statusMap.get("RECEIVED") || 0, color: "#0891b2" },
    { label: "Assigned", value: statusMap.get("ASSIGNED") || 0, color: CHART_COLORS.secondary },
    { label: "In progress", value: statusMap.get("IN_PROGRESS") || 0, color: CHART_COLORS.tertiary },
    { label: "Escalated", value: statusMap.get("ESCALATED") || 0, color: CHART_COLORS.error },
    { label: "Resolved", value: statusMap.get("RESOLVED") || 0, color: CHART_COLORS.success },
    { label: "Verified", value: statusMap.get("VERIFIED") || 0, color: "#15803d" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Voice</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total issues" value={issues} />
        {byStatus.map((b) => <KPI key={b.status} label={b.status} value={b._count as any} />)}
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Issue pipeline</div>
        <StackedBar segments={pipeline} height={26} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-p">
          <div className="section-title mb-3">By category</div>
          <DonutChart
            data={byCategory.map((c) => ({ label: c.category, value: Number(c._count) }))}
            centerValue={issues}
            centerLabel="issues"
          />
        </div>
        <div className="card-p">
          <div className="section-title mb-3">By department</div>
          <BarChart
            orientation="horizontal"
            data={byDept
              .sort((a, b) => Number(b._count) - Number(a._count))
              .map((d) => ({ label: nameMap.get(d.departmentId || "") || "Unrouted", value: Number(d._count) }))}
          />
        </div>
      </div>
    </div>
  );
}
