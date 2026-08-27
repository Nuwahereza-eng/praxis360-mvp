import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { statusColor } from "@/lib/utils";
import { Badge } from "@/components/ui";

export default async function AssessmentDetail({ params }: { params: { id: string } }) {
  const s = await requireRole("LECTURER");
  const a = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      course: { include: { enrollments: { include: { student: true } } } },
      results: { include: { student: true } },
      rubric: { include: { learningOutcome: true } },
    },
  });
  if (!a || a.course.lecturerId !== s.sub) notFound();

  const resultByStudent = new Map(a.results.map((r) => [r.studentId, r]));
  return (
    <div className="space-y-6">
      <div>
        <Link href="/lecturer/assessments" className="link text-sm">← All assessments</Link>
        <h1 className="text-2xl font-bold mt-2">{a.title}</h1>
        <p className="text-on-surface-variant text-sm">{a.course.name} • Total {a.totalMarks} • Pass {a.passMark}%</p>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Students</div>
        <table className="table">
          <thead><tr><th>Student</th><th>Score</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {a.course.enrollments.map((e) => {
              const r = resultByStudent.get(e.studentId);
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.student.firstName} {e.student.lastName}</td>
                  <td>{r ? `${r.percentage.toFixed(0)}%` : "—"}</td>
                  <td><Badge className={statusColor(r?.status || "PENDING")}>{r?.status || "PENDING"}</Badge></td>
                  <td>
                    <Link className="link text-sm" href={`/lecturer/assessments/${a.id}/mark/${e.studentId}`}>Mark →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
