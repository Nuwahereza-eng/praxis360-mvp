import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, Badge } from "@/components/ui";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{me.department?.name}</h1>
        <p className="text-on-surface-variant text-sm">Route → Act → Communicate → Verify</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPI label="Total" value={total} />
        <KPI label="New" value={submitted} tone={submitted > 0 ? "warning" : "default"} />
        <KPI label="Assigned" value={assigned} tone="info" />
        <KPI label="In progress" value={inProgress} tone="info" />
        <KPI label="Escalated" value={escalated} tone={escalated > 0 ? "error" : "default"} />
        <KPI label="Resolved" value={resolved} tone="success" />
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Recent Cases</div>
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
