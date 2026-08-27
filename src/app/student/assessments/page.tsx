import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, statusColor } from "@/lib/utils";
import { Badge } from "@/components/ui";
import Link from "next/link";

export default async function MyAssessments() {
  const s = await requireRole("STUDENT");
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: s.sub },
    include: {
      course: {
        include: {
          assessments: {
            include: { results: { where: { studentId: s.sub } } },
            orderBy: { dueDate: "desc" },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Assessments</h1>
      {enrollments.map((e) => (
        <div key={e.id} className="card-p">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">{e.course.name}</div>
              <div className="text-xs text-on-surface-variant">{e.course.code}</div>
            </div>
          </div>
          {e.course.assessments.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No assessments yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Assessment</th><th>Type</th><th>Due</th><th>Score</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {e.course.assessments.map((a) => {
                  const r = a.results[0];
                  return (
                    <tr key={a.id}>
                      <td className="font-medium">{a.title}</td>
                      <td>{a.type}</td>
                      <td>{fmtDate(a.dueDate)}</td>
                      <td>{r ? `${r.percentage.toFixed(0)}%` : "—"}</td>
                      <td><Badge className={statusColor(r?.status || "PENDING")}>{r?.status || "PENDING"}</Badge></td>
                      <td>
                        {r?.status === "RELEASED" && (
                          <Link href={`/student/feedback/${r.id}`} className="link text-sm">View feedback →</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
