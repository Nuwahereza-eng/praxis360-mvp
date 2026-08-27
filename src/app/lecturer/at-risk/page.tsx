import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { severityColor } from "@/lib/utils";
import Link from "next/link";

export default async function AtRisk() {
  const s = await requireRole("LECTURER");
  const gaps = await prisma.learningGap.findMany({
    where: { course: { lecturerId: s.sub }, status: { not: "RECOVERED" } },
    include: { student: true, course: true, learningOutcome: true },
    orderBy: { detectedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Students at Risk</h1>
      {gaps.length === 0 && <div className="card-p">No active learning gaps in your courses.</div>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Student</th><th>Course</th><th>Learning Outcome</th><th>Severity</th><th>Status</th></tr></thead>
          <tbody>
            {gaps.map((g) => (
              <tr key={g.id}>
                <td className="font-medium">{g.student.firstName} {g.student.lastName}</td>
                <td>{g.course.name}</td>
                <td>{g.learningOutcome.title}</td>
                <td><Badge className={severityColor(g.severity)}>{g.severity}</Badge></td>
                <td>{g.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
