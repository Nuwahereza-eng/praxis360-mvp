import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, ProgressBar } from "@/components/ui";

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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Voice</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total issues" value={issues} />
        {byStatus.map((b) => <KPI key={b.status} label={b.status} value={b._count as any} />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-p">
          <div className="section-title mb-3">By category</div>
          <div className="space-y-3">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm"><span>{c.category}</span><span>{c._count as any}</span></div>
                <ProgressBar value={(Number(c._count) / issues) * 100} />
              </div>
            ))}
          </div>
        </div>
        <div className="card-p">
          <div className="section-title mb-3">By department</div>
          <div className="space-y-3">
            {byDept.map((d) => (
              <div key={d.departmentId || "none"}>
                <div className="flex items-center justify-between text-sm"><span>{nameMap.get(d.departmentId || "") || "Unrouted"}</span><span>{d._count as any}</span></div>
                <ProgressBar value={(Number(d._count) / issues) * 100} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
