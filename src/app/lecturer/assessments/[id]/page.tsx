import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { statusColor } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { applyTemplateToAssessmentAction } from "@/app/lecturer/rubrics/actions";

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

  const templates = await prisma.rubricTemplate.findMany({
    where: { ownerId: s.sub },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { criteria: true } } },
  });

  const resultByStudent = new Map(a.results.map((r) => [r.studentId, r]));
  return (
    <div className="space-y-6">
      <div>
        <Link href="/lecturer/assessments" className="link text-sm">← All assessments</Link>
        <h1 className="text-2xl font-bold mt-2">{a.title}</h1>
        <p className="text-on-surface-variant text-sm">{a.course.name} • Total {a.totalMarks} • Pass {a.passMark}%</p>
      </div>

      <div className="card-p">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title">Rubric ({a.rubric.length})</div>
          <Link href="/lecturer/rubrics" className="link text-sm">Manage templates →</Link>
        </div>
        {a.rubric.length === 0 ? (
          <div className="text-sm text-on-surface-variant py-3">
            No rubric yet. Apply a template below to save time.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant mb-4">
            {a.rubric.map((c) => (
              <li key={c.id} className="py-2 text-sm flex justify-between gap-3">
                <div>
                  <b>{c.title}</b>
                  {c.description && <span className="text-on-surface-variant"> — {c.description}</span>}
                </div>
                <span className="badge bg-surface-container text-on-surface-variant shrink-0">{c.maxMarks} marks</span>
              </li>
            ))}
          </ul>
        )}

        {templates.length > 0 ? (
          <form action={applyTemplateToAssessmentAction} className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-3">
            <input type="hidden" name="assessmentId" value={a.id} />
            <label className="text-sm text-on-surface-variant">Apply template:</label>
            <select className="input" name="templateId" required>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t._count.criteria} criteria)
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
              <input type="checkbox" name="replaceExisting" /> Replace existing
            </label>
            <button className="btn-primary text-sm" type="submit">Apply</button>
          </form>
        ) : (
          <div className="text-xs text-on-surface-variant border-t border-outline-variant pt-3">
            You have no rubric templates yet.{" "}
            <Link href="/lecturer/rubrics" className="link">Create one →</Link>
          </div>
        )}
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
