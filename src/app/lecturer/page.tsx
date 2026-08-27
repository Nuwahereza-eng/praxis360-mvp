import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, Badge } from "@/components/ui";
import { BarChart, DonutChart, CHART_COLORS } from "@/components/Charts";
import { fmtDate, statusColor } from "@/lib/utils";
import Link from "next/link";

export default async function LecturerDashboard() {
  const s = await requireRole("LECTURER");
  const courses = await prisma.course.findMany({ where: { lecturerId: s.sub }, include: { enrollments: true, assessments: { include: { results: true } } } });
  const courseIds = courses.map((c) => c.id);

  const [pendingMarking, gaps, corrections, releasedResults] = await Promise.all([
    prisma.assessmentResult.count({ where: { assessment: { courseId: { in: courseIds } }, status: { in: ["PENDING", "MARKED"] } } }),
    prisma.learningGap.count({ where: { courseId: { in: courseIds }, status: { not: "RECOVERED" } } }),
    prisma.correctionAttempt.count({ where: { activity: { gap: { courseId: { in: courseIds } } } } }),
    prisma.assessmentResult.findMany({ where: { assessment: { courseId: { in: courseIds } }, status: "RELEASED" }, select: { percentage: true } }),
  ]);

  const belowPass = releasedResults.filter((r) => r.percentage < 50).length;
  const avg = releasedResults.length > 0 ? releasedResults.reduce((s, r) => s + r.percentage, 0) / releasedResults.length : 0;

  const assessments = await prisma.assessment.findMany({
    where: { courseId: { in: courseIds } },
    include: { course: true, results: true },
    orderBy: { dueDate: "desc" },
    take: 10,
  });

  // Chart: average per assessment
  const avgChart = assessments
    .map((a) => {
      const released = a.results.filter((r) => r.status === "RELEASED");
      const avg = released.length > 0 ? released.reduce((s, r) => s + r.percentage, 0) / released.length : 0;
      return { label: a.title, value: Math.round(avg), color: avg >= 70 ? CHART_COLORS.success : avg >= 50 ? CHART_COLORS.warning : CHART_COLORS.error };
    })
    .filter((a) => a.value > 0);

  // Score distribution
  const buckets = [
    { label: "0–39%", value: 0, color: CHART_COLORS.error },
    { label: "40–49%", value: 0, color: "#f59e0b" },
    { label: "50–69%", value: 0, color: CHART_COLORS.warning },
    { label: "70–100%", value: 0, color: CHART_COLORS.success },
  ];
  releasedResults.forEach((r) => {
    if (r.percentage < 40) buckets[0].value++;
    else if (r.percentage < 50) buckets[1].value++;
    else if (r.percentage < 70) buckets[2].value++;
    else buckets[3].value++;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
        <p className="text-on-surface-variant text-sm">Assess → Give Feedback → Understand → Act → Verify → Improve</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Pending marking" value={pendingMarking} />
        <KPI label="Below pass mark" value={belowPass} tone={belowPass > 0 ? "warning" : "success"} />
        <KPI label="Active learning gaps" value={gaps} tone={gaps > 0 ? "warning" : "success"} />
        <KPI label="Corrections submitted" value={corrections} tone="info" />
        <KPI label="Class average" value={`${avg.toFixed(0)}%`} />
        <KPI label="Courses" value={courses.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-p">
          <div className="section-title mb-3">Average per assessment</div>
          {avgChart.length > 0 ? (
            <BarChart data={avgChart} valueSuffix="%" height={240} />
          ) : (
            <p className="text-sm text-on-surface-variant">No released assessments yet.</p>
          )}
        </div>
        <div className="card-p">
          <div className="section-title mb-3">Score distribution</div>
          {releasedResults.length > 0 ? (
            <DonutChart data={buckets} centerValue={releasedResults.length} centerLabel="results" />
          ) : (
            <p className="text-sm text-on-surface-variant">No released results yet.</p>
          )}
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Assessments</div>
        <table className="table">
          <thead><tr><th>Assessment</th><th>Course</th><th>Submissions</th><th>Marked</th><th>Average</th><th>Feedback</th><th></th></tr></thead>
          <tbody>
            {assessments.map((a) => {
              const submissions = a.results.length;
              const marked = a.results.filter((r) => r.status !== "PENDING").length;
              const avg = submissions > 0 ? a.results.reduce((s, r) => s + r.percentage, 0) / submissions : 0;
              const released = a.results.filter((r) => r.status === "RELEASED").length;
              return (
                <tr key={a.id}>
                  <td className="font-medium">{a.title}</td>
                  <td>{a.course.name}</td>
                  <td>{submissions}</td>
                  <td>{marked}/{submissions}</td>
                  <td>{avg > 0 ? `${avg.toFixed(0)}%` : "—"}</td>
                  <td><Badge className={statusColor(released === submissions && submissions > 0 ? "RELEASED" : "PENDING")}>{released}/{submissions} released</Badge></td>
                  <td><Link href={`/lecturer/assessments/${a.id}`} className="link text-sm">Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
