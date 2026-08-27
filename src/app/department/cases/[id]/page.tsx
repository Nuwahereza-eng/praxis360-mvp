import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, LoopSteps } from "@/components/ui";
import { fmtDateTime, statusColor } from "@/lib/utils";
import { officerActionAction } from "./actions";

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub } });
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: { student: true, department: true, assignedOfficer: true, updates: { orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  if (!issue || (issue.departmentId && issue.departmentId !== me?.departmentId)) notFound();

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
