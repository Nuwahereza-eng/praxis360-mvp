import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, LoopSteps, SLAPill, AttachmentList } from "@/components/ui";
import { fmtDateTime, statusColor } from "@/lib/utils";
import { officerActionAction } from "./actions";

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub } });
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      student: true,
      department: true,
      assignedOfficer: true,
      updates: { orderBy: { createdAt: "asc" }, include: { author: true } },
      actionPoints: { orderBy: [{ status: "asc" }, { orderIdx: "asc" }, { createdAt: "asc" }] },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!issue || (issue.departmentId && issue.departmentId !== me?.departmentId)) notFound();

  // Departments this case can be forwarded to (any active department except the current one).
  const otherDepartments = await prisma.department.findMany({
    where: { id: { not: me?.departmentId ?? "" } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const stepIndex = ["SUBMITTED","RECEIVED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED"].indexOf(issue.status);
  const identityLabel = issue.privacyMode === "ANONYMOUS" ? "Anonymous student"
    : issue.privacyMode === "CONFIDENTIAL" ? "Confidential — identity hidden in reports"
    : issue.student ? `${issue.student.firstName} ${issue.student.lastName}` : "Unknown";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/department/cases" className="link text-sm">← All cases</Link>
        <h1 className="text-2xl font-bold mt-2">{issue.title}</h1>
        <div className="text-sm text-on-surface-variant">
          {issue.category} • Priority {issue.priority} • {fmtDateTime(issue.createdAt)}
        </div>
      </div>
      <LoopSteps steps={["Submitted","Received","Assigned","In Progress","Resolved","Verified"]} current={stepIndex} />
      <div><SLAPill createdAt={issue.createdAt} priority={issue.priority} status={issue.status} resolvedAt={issue.resolvedAt} /></div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-p md:col-span-2 space-y-3">
          <div>
            <div className="section-title">Description</div>
            <p className="text-sm mt-1 whitespace-pre-line">{issue.description}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">AI Classification</div>
            <p className="text-sm">Category: {issue.category} • Type: {issue.issueType} • Location: {issue.location || "—"} • Confidence: {Math.round((issue.aiConfidence || 0) * 100)}%</p>
          </div>
        </div>
        <div className="card-p">
          <div className="section-title">Case</div>
          <div className="mt-1"><Badge className={statusColor(issue.status)}>{issue.status}</Badge></div>
          <dl className="mt-3 text-sm space-y-1">
            <div className="flex justify-between"><dt className="text-on-surface-variant">Student</dt><dd>{identityLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-on-surface-variant">Assigned</dt><dd>{issue.assignedOfficer ? `${issue.assignedOfficer.firstName} ${issue.assignedOfficer.lastName}` : "—"}</dd></div>
          </dl>

          <form action={officerActionAction} className="mt-4 space-y-2">
            <input type="hidden" name="issueId" value={issue.id} />
            <div className="flex flex-wrap gap-2">
              <button name="op" value="ACCEPT" className="btn-outline text-xs">Accept</button>
              <button name="op" value="ASSIGN_ME" className="btn-outline text-xs">Assign to me</button>
              <button name="op" value="IN_PROGRESS" className="btn-outline text-xs">Mark In Progress</button>
              <button name="op" value="ESCALATE" className="btn-outline text-xs">Escalate</button>
              <button name="op" value="RESOLVE" className="btn-primary text-xs">Resolve</button>
            </div>
          </form>
        </div>
      </div>

      {/* Forward to another department — for cases the student routed incorrectly. */}
      <div className="card-p border-info/30 bg-info-container/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl">↪️</div>
          <div>
            <div className="section-title">Wrong department?</div>
            <p className="text-xs text-on-surface-variant">
              If this case belongs elsewhere, forward it. The receiving department will be notified and the student will see a public update.
            </p>
          </div>
        </div>
        <form action={officerActionAction} className="grid md:grid-cols-3 gap-2">
          <input type="hidden" name="issueId" value={issue.id} />
          <input type="hidden" name="op" value="FORWARD" />
          <select name="targetDepartmentId" required className="input md:col-span-1" defaultValue="">
            <option value="" disabled>Choose department…</option>
            {(() => {
              const academic = otherDepartments.filter((d) => d.type === "ACADEMIC");
              const service = otherDepartments.filter((d) => d.type !== "ACADEMIC");
              return (
                <>
                  {service.length > 0 && (
                    <optgroup label="Service departments">
                      {service.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {academic.length > 0 && (
                    <optgroup label="Academic departments">
                      {academic.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              );
            })()}
          </select>
          <input
            name="forwardReason"
            className="input md:col-span-1"
            placeholder="Optional reason (visible to student)"
            maxLength={200}
          />
          <button type="submit" className="btn-primary md:col-span-1 text-sm">Forward case →</button>
        </form>
      </div>

      {/* Action Points — concrete steps this department commits to. Visible to the student. */}
      <div className="card-p">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title">Action Points</div>
            <p className="text-xs text-on-surface-variant">Steps you commit to. The student sees these and their status.</p>
          </div>
          <div className="text-xs text-on-surface-variant">
            {issue.actionPoints.filter((a) => a.status === "DONE").length} / {issue.actionPoints.length} done
          </div>
        </div>

        {issue.actionPoints.length === 0 && (
          <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-lg p-4 text-center">
            No action points yet. Add the first step below.
          </div>
        )}

        <ol className="space-y-3">
          {issue.actionPoints.map((ap, idx) => (
            <li key={ap.id} className="border border-outline-variant rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">#{idx + 1}</span>
                    <div className="font-medium text-sm">{ap.title}</div>
                    <Badge className={actionStatusColor(ap.status)}>{ap.status.replace("_", " ")}</Badge>
                  </div>
                  {ap.detail && <div className="text-xs text-on-surface-variant mt-1 whitespace-pre-line">{ap.detail}</div>}
                  <div className="text-[10px] text-on-surface-variant mt-1">
                    Added {fmtDateTime(ap.createdAt)}
                    {ap.completedAt ? ` • Completed ${fmtDateTime(ap.completedAt)}` : ""}
                  </div>
                </div>
                <form action={officerActionAction} className="flex flex-wrap gap-1 shrink-0">
                  <input type="hidden" name="issueId" value={issue.id} />
                  <input type="hidden" name="actionId" value={ap.id} />
                  <input type="hidden" name="op" value="SET_ACTION_STATUS" />
                  {["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"]
                    .filter((s) => s !== ap.status)
                    .map((s) => (
                      <button
                        key={s}
                        name="actionStatus"
                        value={s}
                        className="btn-outline text-[11px] px-2 py-1"
                        title={`Mark ${s.toLowerCase().replace("_", " ")}`}
                      >
                        {s === "IN_PROGRESS" ? "Working" : s === "DONE" ? "Done" : s === "BLOCKED" ? "Blocked" : "Reopen"}
                      </button>
                    ))}
                </form>
              </div>
            </li>
          ))}
        </ol>

        <form action={officerActionAction} className="mt-4 space-y-2 border-t border-outline-variant pt-4">
          <input type="hidden" name="issueId" value={issue.id} />
          <input type="hidden" name="op" value="ADD_ACTION" />
          <label className="label">Add action point</label>
          <input
            name="actionTitle"
            className="input"
            placeholder="e.g. Replace faulty Wi-Fi access point"
            required
            maxLength={140}
          />
          <textarea
            name="actionDetail"
            className="input min-h-[60px]"
            placeholder="Optional detail visible to the student…"
            maxLength={500}
          />
          <button className="btn-primary text-sm">Add action point</button>
        </form>
      </div>

      <AttachmentList attachments={issue.attachments} title="Evidence from student" />

      <div className="card-p">
        <div className="section-title mb-2">Timeline</div>
        <ol className="space-y-3">
          {issue.updates.map((u) => (
            <li key={u.id} className="border-l-2 border-primary/40 pl-3">
              <div className="text-xs text-on-surface-variant">
                {fmtDateTime(u.createdAt)} • {u.type} {u.visibleToStudent ? "" : "• INTERNAL"}
              </div>
              <div className="text-sm">{u.message}</div>
              {u.author && <div className="text-xs text-on-surface-variant">— {u.author.firstName} {u.author.lastName}</div>}
            </li>
          ))}
        </ol>

        <form action={officerActionAction} className="mt-4 space-y-2 border-t border-outline-variant pt-4">
          <input type="hidden" name="issueId" value={issue.id} />
          <label className="label">Add update</label>
          <textarea name="message" className="input min-h-[80px]" placeholder="Communication or internal note…" required />
          <div className="flex gap-2 items-center">
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" name="internal" /> Internal note
            </label>
            <button name="op" value="ADD_UPDATE" className="btn-primary">Post update</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function actionStatusColor(status: string) {
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
