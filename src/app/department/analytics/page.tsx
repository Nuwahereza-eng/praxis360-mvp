import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";

export default async function DeptAnalytics() {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub } });
  if (!me?.departmentId) return null;
  const where = { departmentId: me.departmentId };
  const [total, resolved, verified, submitted] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.issue.count({ where: { ...where, status: "VERIFIED" } }),
    prisma.issue.count({ where: { ...where, status: "SUBMITTED" } }),
  ]);
  const resolvedIssues = await prisma.issue.findMany({ where: { ...where, resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } });
  const avgDays = resolvedIssues.length > 0
    ? resolvedIssues.reduce((s, i) => s + (((i.resolvedAt?.getTime() || 0) - i.createdAt.getTime()) / 86400000), 0) / resolvedIssues.length
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Department Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total cases" value={total} />
        <KPI label="Resolved" value={resolved + verified} tone="success" />
        <KPI label="Backlog" value={submitted} tone={submitted > 0 ? "warning" : "default"} />
        <KPI label="Avg. resolution" value={`${avgDays.toFixed(1)}d`} tone={avgDays < 3 ? "success" : "warning"} />
      </div>
    </div>
  );
}
