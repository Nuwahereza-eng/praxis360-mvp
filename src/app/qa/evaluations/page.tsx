import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai";
import { KPI } from "@/components/ui";

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
    return { course: c, responseRate, avgRating, comments };
  }));
  const overall = rows.length > 0 ? rows.reduce((s, r) => s + r.responseRate, 0) / rows.length : 0;
  const allComments = rows.flatMap((r) => r.comments);
  const themes = AIService.extractEvaluationThemes(allComments);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teaching Evaluation</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Overall response rate" value={`${overall.toFixed(0)}%`} tone={overall > 60 ? "success" : "warning"} />
        <KPI label="Courses" value={rows.length} />
        <KPI label="Written comments" value={allComments.length} />
      </div>
      <div className="card-p">
        <div className="section-title mb-3">By course</div>
        <table className="table">
          <thead><tr><th>Course</th><th>Enrolled</th><th>Response %</th><th>Avg rating (of 5)</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.course.id}>
                <td>{r.course.name}</td>
                <td>{r.course.enrollments.length}</td>
                <td>{r.responseRate.toFixed(0)}%</td>
                <td>{r.avgRating > 0 ? r.avgRating.toFixed(1) : "—"}</td>
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
