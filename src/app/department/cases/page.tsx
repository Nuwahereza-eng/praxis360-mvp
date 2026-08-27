import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { fmtDate, statusColor } from "@/lib/utils";

export default async function DepartmentCases({ searchParams }: { searchParams: { status?: string; category?: string } }) {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub } });
  if (!me?.departmentId) return null;

  const where: any = { departmentId: me.departmentId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.category) where.category = searchParams.category;

  const list = await prisma.issue.findMany({ where, orderBy: { createdAt: "desc" }, include: { student: true } });

  const statuses = ["SUBMITTED","RECEIVED","ASSIGNED","IN_PROGRESS","ESCALATED","RESOLVED","VERIFIED","REOPENED"];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cases</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Link href="/department/cases" className="badge bg-surface-container text-on-surface-variant">All</Link>
          {statuses.map((st) => (
            <Link key={st} href={`/department/cases?status=${st}`} className="badge bg-surface-container text-on-surface-variant">{st}</Link>
          ))}
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">{i.title}</td>
                <td>{i.category}</td>
                <td>{i.priority}</td>
                <td>{fmtDate(i.createdAt)}</td>
                <td><Badge className={statusColor(i.status)}>{i.status}</Badge></td>
                <td><Link className="link text-sm" href={`/department/cases/${i.id}`}>Open</Link></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="text-center text-on-surface-variant py-8">No matching cases.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
