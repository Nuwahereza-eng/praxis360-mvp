import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI, Badge, LoopSteps } from "@/components/ui";
import { LineChart, DonutChart, CHART_COLORS } from "@/components/Charts";
import { fmtDate, statusColor } from "@/lib/utils";
import Link from "next/link";

export default async function StudentDashboard() {
  const s = await requireRole("STUDENT");
  const [enrollments, results, gaps, issues, notifs] = await Promise.all([
    prisma.enrollment.count({ where: { studentId: s.sub } }),
    prisma.assessmentResult.findMany({ where: { studentId: s.sub, status: "RELEASED" }, include: { assessment: { include: { course: true } } }, orderBy: { feedbackReleasedAt: "desc" }, take: 5 }),
    prisma.learningGap.count({ where: { studentId: s.sub, status: { in: ["IDENTIFIED", "IN_PROGRESS"] } } }),
    prisma.issue.findMany({ where: { studentId: s.sub }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.notification.count({ where: { userId: s.sub, read: false } }),
  ]);

  const avg = results.length > 0
    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
    : 0;

  // Trend chart: student's scores across their released results (oldest → newest)
  const trend = [...results].reverse();
  const trendLabels = trend.map((r) => r.assessment.title);
  const trendValues = trend.map((r) => Math.round(r.percentage));

  // Personal score distribution
  const buckets = [
    { label: "Struggling (<50%)", value: results.filter((r) => r.percentage < 50).length, color: CHART_COLORS.error },
    { label: "Passing (50–69%)", value: results.filter((r) => r.percentage >= 50 && r.percentage < 70).length, color: CHART_COLORS.warning },
    { label: "Strong (70%+)", value: results.filter((r) => r.percentage >= 70).length, color: CHART_COLORS.success },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your learning journey</h1>
          <p className="text-on-surface-variant text-sm">Assess → Understand → Act → Verify → Improve</p>
        </div>
        <Link href="/student/issues/new" className="btn-primary">Raise an Issue</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Enrolled Courses" value={enrollments} />
        <KPI label="Average Score" value={`${avg.toFixed(0)}%`} tone={avg >= 70 ? "success" : avg >= 50 ? "warning" : "error"} />
        <KPI label="Active Learning Gaps" value={gaps} tone={gaps > 0 ? "warning" : "success"} />
        <KPI label="Unread Notifications" value={notifs} />
      </div>

      {results.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card-p md:col-span-2">
            <div className="section-title mb-3">Your performance trend</div>
            <LineChart
              labels={trendLabels}
              series={[{ name: "Score", values: trendValues, color: CHART_COLORS.primary }]}
              ySuffix="%"
              yMax={100}
              height={220}
            />
          </div>
          <div className="card-p">
            <div className="section-title mb-3">Score distribution</div>
            <DonutChart data={buckets} centerValue={`${avg.toFixed(0)}%`} centerLabel="average" size={170} />
          </div>
        </div>
      )}

      <div className="card-p">
        <div className="section-title mb-2">Recent Feedback</div>
        {results.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No feedback released yet.</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {results.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.assessment.title}</div>
                  <div className="text-xs text-on-surface-variant">{r.assessment.course.name} • Released {fmtDate(r.feedbackReleasedAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{r.percentage.toFixed(0)}%</span>
                  <Link href={`/student/feedback/${r.id}`} className="btn-outline text-sm">View</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-p">
        <div className="section-title mb-3">My Recent Issues</div>
        {issues.length === 0 ? (
          <p className="text-on-surface-variant text-sm">You haven&apos;t raised any issues yet.</p>
        ) : (
          <ul className="space-y-3">
            {issues.map((i) => (
              <li key={i.id} className="border border-outline-variant rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/student/issues/${i.id}`} className="font-medium hover:underline">{i.title}</Link>
                    <div className="text-xs text-on-surface-variant">{i.category} • {fmtDate(i.createdAt)}</div>
                  </div>
                  <Badge className={statusColor(i.status)}>{i.status}</Badge>
                </div>
                <div className="mt-3">
                  <LoopSteps steps={["Submitted","Received","Assigned","In Progress","Resolved","Verified"]}
                    current={["SUBMITTED","RECEIVED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED"].indexOf(i.status)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
