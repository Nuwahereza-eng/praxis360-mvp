import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai";
import { KPI, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import Link from "next/link";

export default async function QAEvaluations() {
  await requireRole("QA");
  const courses = await prisma.course.findMany({ include: { enrollments: true } });
  const rows = await Promise.all(courses.map(async (c) => {
    const responses = await prisma.evaluationResponse.findMany({ where: { courseId: c.id }, include: { question: true } });
    const participants = new Set(responses.map((r) => r.studentId)).size;
    const responseRate = c.enrollments.length > 0 ? (participants / c.enrollments.length) * 100 : 0;
    const rated = responses.filter((r) => r.question.type === "RATING" && r.rating);
    const avgRating = rated.length > 0 ? rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length : 0;
    const comments = responses.filter((r) => r.question.type === "TEXT" && r.text).map((r) => r.text!) as string[];
    const customQs = await prisma.evaluationQuestion.count({ where: { courseId: c.id } });
    return { course: c, responseRate, avgRating, comments, customQs };
  }));
  const overall = rows.length > 0 ? rows.reduce((s, r) => s + r.responseRate, 0) / rows.length : 0;
  const allComments = rows.flatMap((r) => r.comments);
  const themes = AIService.extractEvaluationThemes(allComments);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Teaching Evaluation</h1>
          <p className="text-on-surface-variant text-sm">Aggregated results • Manage the questions students see per course.</p>
        </div>
        <Link href="/qa/evaluations/form" className="btn-primary inline-flex items-center gap-1.5">
          <Icon.Edit className="w-4 h-4" strokeWidth={2} />
          Edit evaluation forms
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Overall response rate" value={`${overall.toFixed(0)}%`} tone={overall > 60 ? "success" : "warning"} icon={Icon.Trend} />
        <KPI label="Courses" value={rows.length} icon={Icon.Courses} />
        <KPI label="Written comments" value={allComments.length} icon={Icon.Chat} />
      </div>
      <div className="card-p">
        <SectionHeader title="By course" icon={Icon.Analytics} />
        <table className="table">
          <thead><tr><th>Course</th><th>Enrolled</th><th>Response %</th><th>Avg rating (of 5)</th><th>Form</th><th className="text-right">Edit</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.course.id}>
                <td>{r.course.name}</td>
                <td>{r.course.enrollments.length}</td>
                <td>{r.responseRate.toFixed(0)}%</td>
                <td>{r.avgRating > 0 ? r.avgRating.toFixed(1) : "—"}</td>
                <td className="text-xs text-on-surface-variant">
                  {r.customQs > 0 ? `Custom (${r.customQs})` : "Global"}
                </td>
                <td className="text-right">
                  <Link href={`/qa/evaluations/form/${r.course.id}`} className="link text-sm">Edit →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-p">
        <div className="section-title mb-3">Themes across written comments</div>
        {themes.length === 0 && <p className="text-sm text-on-surface-variant">No comments yet.</p>}
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <span key={t.theme} className="badge bg-surface-container text-on-surface-variant">
              {t.theme} ({t.count}) • {t.sentiment}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
