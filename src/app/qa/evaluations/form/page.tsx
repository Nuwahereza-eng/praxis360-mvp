import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui";

export default async function QAEvaluationFormHub() {
  await requireRole("QA");

  const [globalCount, courses] = await Promise.all([
    prisma.evaluationQuestion.count({ where: { courseId: null } }),
    prisma.course.findMany({
      orderBy: { code: "asc" },
      include: {
        lecturer: true,
        department: true,
        _count: { select: { evaluationQuestions: true, enrollments: true } },
      },
    }),
  ]);

  const globalRating = await prisma.evaluationQuestion.count({ where: { courseId: null, type: "RATING" } });
  const globalText = globalCount - globalRating;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Evaluation forms</h1>
          <p className="text-on-surface-variant text-sm">
            Edit the global template that every course inherits, or customize a specific course&apos;s form.
          </p>
        </div>
        <Link href="/qa/evaluations" className="btn-outline text-sm">← Back to evaluations</Link>
      </div>

      {/* Global template card */}
      <Link
        href="/qa/evaluations/form/global"
        className="block rounded-2xl p-5 bg-gradient-to-br from-primary via-primary to-secondary text-on-primary shadow-card hover:opacity-95 transition"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">🌐 Global template</div>
            <div className="text-lg font-bold mt-1">Default form used by every course without customisation</div>
            <div className="text-xs opacity-90 mt-1">
              {globalRating} rating question{globalRating === 1 ? "" : "s"} • {globalText} comment prompt{globalText === 1 ? "" : "s"}
            </div>
          </div>
          <span className="btn bg-white text-primary hover:bg-white/90 font-semibold">Edit template →</span>
        </div>
      </Link>

      {/* Per-course table */}
      <div className="card-p">
        <div className="section-title mb-3">Per-course forms</div>
        {courses.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No courses yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Lecturer</th>
                <th>Department</th>
                <th>Enrolled</th>
                <th>Form</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const customCount = c._count.evaluationQuestions;
                const isCustom = customCount > 0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-on-surface-variant">{c.code}</div>
                    </td>
                    <td className="text-sm">{c.lecturer.firstName} {c.lecturer.lastName}</td>
                    <td className="text-sm">{c.department.name}</td>
                    <td className="text-sm">{c._count.enrollments}</td>
                    <td>
                      {isCustom ? (
                        <Badge className="bg-primary-container text-primary">Custom ({customCount} Qs)</Badge>
                      ) : (
                        <Badge className="bg-surface-container text-on-surface-variant">Uses global</Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <Link href={`/qa/evaluations/form/${c.id}`} className="link text-sm">
                        {isCustom ? "Edit" : "Customize"} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
