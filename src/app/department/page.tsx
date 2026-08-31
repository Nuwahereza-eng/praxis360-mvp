import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, Badge, SectionHeader } from "@/components/ui";
import { StackedBar, DonutChart, CHART_COLORS } from "@/components/Charts";
import { Icon } from "@/components/icons";
import Link from "next/link";
import { fmtDate, statusColor } from "@/lib/utils";

export default async function DepartmentDashboard() {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub }, include: { department: true } });
  if (!me?.departmentId) return <div className="card-p">You are not assigned to a department.</div>;

  const where = { departmentId: me.departmentId };
  const [total, submitted, assigned, inProgress, escalated, resolved] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.count({ where: { ...where, status: "SUBMITTED" } }),
    prisma.issue.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.issue.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { ...where, status: "ESCALATED" } }),
    prisma.issue.count({ where: { ...where, status: { in: ["RESOLVED", "VERIFIED"] } } }),
  ]);
  const recent = await prisma.issue.findMany({ where, include: { student: true }, orderBy: { createdAt: "desc" }, take: 10 });

  const byCategory = await prisma.issue.groupBy({ by: ["category"], where, _count: true });
  const catData = byCategory.map((c) => ({ label: c.category, value: Number(c._count) }));
  const pipeline = [
    { label: "New", value: submitted, color: CHART_COLORS.info },
    { label: "Assigned", value: assigned, color: CHART_COLORS.secondary },
    { label: "In progress", value: inProgress, color: CHART_COLORS.tertiary },
    { label: "Escalated", value: escalated, color: CHART_COLORS.error },
    { label: "Resolved", value: resolved, color: CHART_COLORS.success },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{me.department?.name}</h1>
        <p className="text-on-surface-variant text-sm">Route → Act → Communicate → Verify</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPI label="Total" value={total} icon={Icon.Cases} />
        <KPI label="New" value={submitted} tone={submitted > 0 ? "warning" : "default"} icon={Icon.New} />
        <KPI label="Assigned" value={assigned} tone="info" icon={Icon.Inbox} />
        <KPI label="In progress" value={inProgress} tone="info" icon={Icon.InProgress} />
        <KPI label="Escalated" value={escalated} tone={escalated > 0 ? "error" : "default"} icon={Icon.AtRisk} />
        <KPI label="Resolved" value={resolved} tone="success" icon={Icon.Resolved} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p md:col-span-2">
          <SectionHeader title="Case pipeline" icon={Icon.Trend} />
          {total > 0 ? (
            <StackedBar segments={pipeline} height={26} />
          ) : (
            <p className="text-sm text-on-surface-variant">No cases yet.</p>
          )}
        </div>
        <div className="card-p">
          <SectionHeader title="By category" icon={Icon.Analytics} />
          {catData.length > 0 ? (
            <DonutChart data={catData} centerValue={total} centerLabel="cases" size={170} />
          ) : (
            <p className="text-sm text-on-surface-variant">—</p>
          )}
        </div>
      </div>

      <div className="card-p">
        <SectionHeader title="Recent Cases" icon={Icon.Cases} />
        <table className="table">
          <thead><tr><th>Title</th><th>Category</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {recent.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">{i.title}</td>
                <td>{i.category}</td>
                <td>{fmtDate(i.createdAt)}</td>
                <td><Badge className={statusColor(i.status)}>{i.status}</Badge></td>
                <td><Link className="link text-sm" href={`/department/cases/${i.id}`}>Open →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
