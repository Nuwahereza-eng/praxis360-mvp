import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, LoopSteps } from "@/components/ui";
import { fmtDateTime, statusColor } from "@/lib/utils";
import { verifyIssueAction } from "./actions";

export default async function StudentIssueDetail({ params }: { params: { id: string } }) {
  const s = await requireRole("STUDENT");
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      assignedOfficer: true,
      updates: { where: { visibleToStudent: true }, orderBy: { createdAt: "asc" }, include: { author: true } },
      actionPoints: { orderBy: [{ status: "asc" }, { orderIdx: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!issue || (issue.studentId && issue.studentId !== s.sub)) notFound();

  const totalActions = issue.actionPoints.length;
  const doneActions = issue.actionPoints.filter((a) => a.status === "DONE").length;
  const actionsPct = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;

  const steps = ["SUBMITTED","RECEIVED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED"];
  const current = steps.indexOf(issue.status);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/student/issues" className="link text-sm">← All issues</Link>
        <h1 className="text-2xl font-bold mt-2">{issue.title}</h1>
        <div className="text-sm text-on-surface-variant">
          {issue.category} • Routed to {issue.department?.name || "Triage"} • {fmtDateTime(issue.createdAt)}
        </div>
      </div>

      <LoopSteps steps={["Submitted","Received","Assigned","In Progress","Resolved","Verified"]} current={current} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p md:col-span-2">
          <div className="section-title">Description</div>
          <p className="text-sm mt-1 whitespace-pre-line">{issue.description}</p>
        </div>
        <div className="card-p">
          <div className="section-title">Status</div>
          <div className="mt-1"><Badge className={statusColor(issue.status)}>{issue.status}</Badge></div>
          <dl className="mt-3 text-sm space-y-1">
            <div className="flex justify-between"><dt className="text-on-surface-variant">Priority</dt><dd>{issue.priority}</dd></div>
            <div className="flex justify-between"><dt className="text-on-surface-variant">Location</dt><dd>{issue.location || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-on-surface-variant">Privacy</dt><dd>{issue.privacyMode}</dd></div>
            <div className="flex justify-between"><dt className="text-on-surface-variant">Case Officer</dt><dd>{issue.assignedOfficer ? `${issue.assignedOfficer.firstName} ${issue.assignedOfficer.lastName}` : "—"}</dd></div>
          </dl>
        </div>
      </div>

      <div className="card-p">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title">What the department is doing</div>
            <p className="text-xs text-on-surface-variant">Concrete action points and their live status.</p>
          </div>
          <div className="text-xs text-on-surface-variant">
            {totalActions > 0 ? `${doneActions} / ${totalActions} done (${actionsPct}%)` : "No action points yet"}
          </div>
        </div>

        {totalActions > 0 && (
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden mb-3">
            <div className="h-full bg-success" style={{ width: `${actionsPct}%` }} />
          </div>
        )}

        {totalActions === 0 ? (
          <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-lg p-4 text-center">
            The case officer hasn&apos;t published action points yet. You&apos;ll be notified when they do.
          </div>
        ) : (
          <ol className="space-y-2">
            {issue.actionPoints.map((ap, idx) => (
              <li key={ap.id} className="border border-outline-variant rounded-lg p-3 flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${
                    ap.status === "DONE"
                      ? "bg-success text-white"
                      : ap.status === "IN_PROGRESS"
                      ? "bg-info text-white"
                      : ap.status === "BLOCKED"
                      ? "bg-error text-white"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                  aria-hidden
                >
                  {ap.status === "DONE" ? "✓" : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-sm">{ap.title}</div>
                    <Badge className={studentActionColor(ap.status)}>{ap.status.replace("_", " ")}</Badge>
                  </div>
                  {ap.detail && <div className="text-xs text-on-surface-variant mt-1 whitespace-pre-line">{ap.detail}</div>}
                  <div className="text-[10px] text-on-surface-variant mt-1">
                    {ap.completedAt ? `Completed ${fmtDateTime(ap.completedAt)}` : `Added ${fmtDateTime(ap.createdAt)}`}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Timeline</div>
        <ol className="space-y-3">
          {issue.updates.map((u) => (
            <li key={u.id} className="border-l-2 border-primary/40 pl-3">
              <div className="text-xs text-on-surface-variant">{fmtDateTime(u.createdAt)} • {u.type}</div>
              <div className="text-sm">{u.message}</div>
              {u.author && <div className="text-xs text-on-surface-variant">— {u.author.firstName} {u.author.lastName}</div>}
            </li>
          ))}
        </ol>
      </div>

      {issue.status === "RESOLVED" && (
        <div className="card-p bg-success-container/40 border-success/30">
          <div className="section-title">Was your issue resolved satisfactorily?</div>
          <form action={verifyIssueAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="issueId" value={issue.id} />
            <button name="response" value="YES" className="btn-primary">Yes, resolved</button>
            <button name="response" value="PARTIAL" className="btn-outline">Partially</button>
            <button name="response" value="NO" className="btn-outline">No — reopen</button>
          </form>
        </div>
      )}
    </div>
  );
}

function studentActionColor(status: string) {
  switch (status) {
    case "DONE":
      return "bg-success-container text-success";
    case "IN_PROGRESS":
      return "bg-info-container text-info";
    case "BLOCKED":
      return "bg-error-container text-error";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}
