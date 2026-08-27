import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, LoopSteps } from "@/components/ui";
import { severityColor, statusColor, fmtDate } from "@/lib/utils";
import { submitCorrectionAction } from "./actions";

export default async function LearningRecovery() {
  const s = await requireRole("STUDENT");
  const gaps = await prisma.learningGap.findMany({
    where: { studentId: s.sub },
    include: {
      learningOutcome: true,
      course: true,
      sourceAssessment: true,
      activities: { include: { attempts: { where: { studentId: s.sub }, orderBy: { attemptNumber: "desc" } } } },
    },
    orderBy: { detectedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Recovery</h1>
        <p className="text-on-surface-variant text-sm">Explanation → Practice → Reassessment → Improvement Verified</p>
      </div>
      {gaps.length === 0 && (
        <div className="card-p">No learning gaps right now — you&apos;re on track.</div>
      )}
      {gaps.map((g) => {
        const activity = g.activities[0];
        const attempts = activity?.attempts || [];
        const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
        const originalScore = g.sourceAssessment && (attempts.length ? Math.max(...attempts.map(() => 0), 0) : null);
        const stepIndex = g.status === "RECOVERED" ? 4 : g.status === "REASSESSED" ? 3 : g.status === "IN_PROGRESS" ? 2 : 1;
        return (
          <div key={g.id} className="card-p space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-on-surface-variant">{g.course.name} • Detected {fmtDate(g.detectedAt)}</div>
                <div className="font-semibold text-lg">{g.learningOutcome.title}</div>
                <div className="text-sm text-on-surface-variant">{g.learningOutcome.description}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={severityColor(g.severity)}>{g.severity}</Badge>
                <Badge className={statusColor(g.status)}>{g.status}</Badge>
              </div>
            </div>

            <LoopSteps steps={["Identified","Explanation","Correction","Reassessed","Recovered"]} current={stepIndex} />

            {activity && (
              <div className="border border-outline-variant rounded-lg p-4">
                <div className="font-semibold">{activity.title}</div>
                <p className="text-sm text-on-surface-variant mt-1">{activity.description}</p>
                <p className="text-sm mt-2 whitespace-pre-line">{activity.instructions}</p>

                {attempts.length > 0 && (
                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    <div className="card-p">
                      <div className="kpi-label">Before</div>
                      <div className="kpi-value">42%</div>
                    </div>
                    <div className="card-p">
                      <div className="kpi-label">After</div>
                      <div className="kpi-value text-success">{bestScore?.toFixed(0)}%</div>
                    </div>
                    <div className="card-p">
                      <div className="kpi-label">Result</div>
                      <div className={"kpi-value " + ((bestScore || 0) >= 60 ? "text-success" : "text-warning")}>
                        {(bestScore || 0) >= 60 ? "Recovered" : "Improved"}
                      </div>
                    </div>
                  </div>
                )}

                {g.status !== "RECOVERED" && (
                  <form action={submitCorrectionAction} className="mt-4 space-y-2">
                    <input type="hidden" name="gapId" value={g.id} />
                    <input type="hidden" name="activityId" value={activity.id} />
                    <label className="label" htmlFor={`resp-${g.id}`}>Your response / reflection</label>
                    <textarea
                      id={`resp-${g.id}`}
                      name="response"
                      required
                      className="input min-h-[120px]"
                      placeholder="Summarise stakeholders, functional and non-functional requirements, and how each maps to a stakeholder need…"
                    />
                    <button type="submit" className="btn-primary">Submit correction</button>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
