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
    },
  });
  if (!issue || (issue.studentId && issue.studentId !== s.sub)) notFound();

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
