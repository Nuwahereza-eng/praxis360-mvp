import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtDate } from "@/lib/utils";

export default async function LecturerAssessments() {
  const s = await requireRole("LECTURER");
  const assessments = await prisma.assessment.findMany({
    where: { course: { lecturerId: s.sub } },
    include: { course: true, results: true },
    orderBy: { dueDate: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assessments</h1>
      <table className="table card">
        <thead><tr><th>Assessment</th><th>Course</th><th>Due</th><th>Submissions</th><th>Released</th><th></th></tr></thead>
        <tbody>
          {assessments.map((a) => {
            const released = a.results.filter((r) => r.status === "RELEASED").length;
            return (
              <tr key={a.id}>
                <td className="font-medium">{a.title}</td>
                <td>{a.course.name}</td>
                <td>{fmtDate(a.dueDate)}</td>
                <td>{a.results.length}</td>
                <td>{released}/{a.results.length}</td>
                <td><Link className="link text-sm" href={`/lecturer/assessments/${a.id}`}>Open →</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
