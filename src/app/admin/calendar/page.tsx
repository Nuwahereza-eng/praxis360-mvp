import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";

export default async function AdminCalendar() {
  await requireRole("ADMIN");
  const semesters = await prisma.semester.findMany({ orderBy: { startDate: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Academic Calendar</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>Semester</th><th>Year</th><th>Start</th><th>End</th><th>Eval Start</th><th>Eval End</th><th>Status</th></tr></thead>
          <tbody>
            {semesters.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.academicYear}</td>
                <td>{fmtDate(s.startDate)}</td>
                <td>{fmtDate(s.endDate)}</td>
                <td>{fmtDate(s.evaluationStartDate)}</td>
                <td>{fmtDate(s.evaluationEndDate)}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
