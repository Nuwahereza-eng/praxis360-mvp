import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";

export default async function QAFeedback() {
  await requireRole("QA");
  const results = await prisma.assessmentResult.findMany({
    where: { status: "RELEASED" },
    include: { assessment: { include: { course: true } } },
  });
  const perCourse: Record<string, { name: string; total: number; onTime: number; totalScore: number }> = {};
  for (const r of results) {
    const key = r.assessment.courseId;
    perCourse[key] ??= { name: r.assessment.course.name, total: 0, onTime: 0, totalScore: 0 };
    perCourse[key].total++;
    perCourse[key].totalScore += r.percentage;
    if (r.feedbackReleasedAt && r.feedbackReleasedAt.getTime() - r.assessment.dueDate.getTime() <= 7 * 86400000)
      perCourse[key].onTime++;
  }
  const rows = Object.values(perCourse);
  const overallOnTime = rows.length > 0 ? rows.reduce((s, r) => s + (r.onTime / r.total) * 100, 0) / rows.length : 0;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assessment Feedback</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Feedback released" value={results.length} />
        <KPI label="Courses tracked" value={rows.length} />
        <KPI label="On-time avg" value={`${overallOnTime.toFixed(0)}%`} tone={overallOnTime > 70 ? "success" : "warning"} />
      </div>
      <div className="card-p">
        <table className="table">
          <thead><tr><th>Course</th><th>Released</th><th>On-time %</th><th>Avg Score</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="font-medium">{r.name}</td>
                <td>{r.total}</td>
                <td>{Math.round((r.onTime / r.total) * 100)}%</td>
                <td>{(r.totalScore / r.total).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
