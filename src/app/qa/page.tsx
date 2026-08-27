import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai";
import { KPI, ProgressBar, InsightCard } from "@/components/ui";
import Link from "next/link";

export default async function QADashboard() {
  await requireRole("QA");
  const now = new Date();
  const [
    totalResults, releasedResults, totalIssues, resolvedIssues, verifiedIssues,
    gaps, recoveredGaps, students, atRisk, actions,
    totalResponses, evalEligibleStudents, semester,
  ] = await Promise.all([
    prisma.assessmentResult.count(),
    prisma.assessmentResult.findMany({ where: { status: "RELEASED" }, select: { feedbackReleasedAt: true, assessment: { select: { dueDate: true } } } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { status: { in: ["RESOLVED", "VERIFIED"] } } }),
    prisma.issue.count({ where: { status: "VERIFIED" } }),
    prisma.learningGap.count(),
    prisma.learningGap.count({ where: { status: "RECOVERED" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.learningGap.count({ where: { status: { in: ["IDENTIFIED", "IN_PROGRESS"] } } }),
    prisma.institutionalAction.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { responsibleDepartment: true } }),
    prisma.evaluationResponse.groupBy({ by: ["studentId", "courseId"], _count: true }),
    prisma.enrollment.count(),
    prisma.semester.findFirst({ where: { status: "ACTIVE" } }),
  ]);

  const onTime = releasedResults.filter((r) => r.feedbackReleasedAt && r.assessment.dueDate && r.feedbackReleasedAt.getTime() - r.assessment.dueDate.getTime() <= 7 * 86400000).length;
  const onTimePct = releasedResults.length > 0 ? Math.round((onTime / releasedResults.length) * 100) : 0;
  const responsePct = evalEligibleStudents > 0 ? Math.round((totalResponses.length / evalEligibleStudents) * 100) : 0;
  const feedbackQualityAvg = 76; // reflected by AI service TUAA; hardcoded aggregate for MVP
  const resolutionPct = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
  const verifiedPct = resolvedIssues > 0 ? Math.round((verifiedIssues / resolvedIssues) * 100) : 0;

  const resolvedList = await prisma.issue.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } });
  const avgResolutionDays = resolvedList.length > 0 ? resolvedList.reduce((s, i) => s + (((i.resolvedAt?.getTime() || 0) - i.createdAt.getTime()) / 86400000), 0) / resolvedList.length : 0;
  const recoveryRate = gaps > 0 ? Math.round((recoveredGaps / gaps) * 100) : 0;

  const openIssues = totalIssues - resolvedIssues;
  const insights = AIService.generateQAInsights({
    onTimeFeedbackPct: onTimePct,
    responseRatePct: responsePct,
    openIssues,
    recoveredGaps,
    resolvedIssues,
  });

  // Category breakdown
  const catRaw = await prisma.issue.groupBy({ by: ["category"], _count: true, orderBy: { _count: { category: "desc" } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic & Student Experience Intelligence</h1>
        <p className="text-on-surface-variant text-sm">Semester {semester?.name} • {semester?.academicYear}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Feedback Quality" value={`${feedbackQualityAvg}`} hint="TUAA composite" tone={feedbackQualityAvg > 70 ? "success" : "warning"} />
        <KPI label="On-time Feedback" value={`${onTimePct}%`} tone={onTimePct > 70 ? "success" : "warning"} />
        <KPI label="Eval. Response Rate" value={`${responsePct}%`} tone={responsePct > 60 ? "success" : "warning"} />
        <KPI label="Issue Resolution" value={`${resolutionPct}%`} tone={resolutionPct > 60 ? "success" : "warning"} />
        <KPI label="Verified Resolution" value={`${verifiedPct}%`} />
        <KPI label="Avg. Resolution" value={`${avgResolutionDays.toFixed(1)}d`} />
        <KPI label="Students at Risk" value={atRisk} tone={atRisk > 0 ? "warning" : "success"} />
        <KPI label="Recovered Gaps" value={`${recoveredGaps} (${recoveryRate}%)`} tone="success" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-p">
          <div className="section-title mb-3">AI Insights</div>
          <div className="space-y-3">
            {insights.map((i, idx) => <InsightCard key={idx} severity={i.severity} text={i.text} action={i.action} />)}
          </div>
        </div>
        <div className="card-p">
          <div className="section-title mb-3">Issue categories</div>
          <div className="space-y-3">
            {catRaw.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.category}</span>
                  <span className="text-on-surface-variant">{c._count}</span>
                </div>
                <ProgressBar value={totalIssues > 0 ? (Number(c._count) / totalIssues) * 100 : 0} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-p">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title">Recent Institutional Actions</div>
          <Link href="/qa/actions" className="link text-sm">Manage →</Link>
        </div>
        <ul className="divide-y divide-outline-variant">
          {actions.map((a) => (
            <li key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-on-surface-variant">
                  {a.responsibleDepartment?.name || "—"} • {a.status} {a.published ? "• Published" : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
