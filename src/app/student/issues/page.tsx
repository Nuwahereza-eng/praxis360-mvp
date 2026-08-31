import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, LoopSteps, SLAPill } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fmtDate, statusColor } from "@/lib/utils";

export default async function MyIssues() {
  const s = await requireRole("STUDENT");
  const issues = await prisma.issue.findMany({
    where: { studentId: s.sub },
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">My Issues</h1>
        <div className="flex gap-2">
          <Link href="/student/issues/board" className="btn-outline inline-flex items-center gap-1.5">
            <Icon.Community className="w-4 h-4" strokeWidth={2} />
            Community board
          </Link>
          <Link href="/student/issues/new" className="btn-primary inline-flex items-center gap-1.5">
            <Icon.Plus className="w-4 h-4" strokeWidth={2} />
            Raise an Issue
          </Link>
        </div>
      </div>
      {issues.length === 0 && (
        <div className="card-p text-center py-10">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-container text-primary grid place-items-center mb-3">
            <Icon.MyIssues className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="text-lg font-semibold">No issues yet</div>
          <div className="text-sm text-on-surface-variant mt-1">Raise one to get the closed-loop started.</div>
        </div>
      )}
      <div className="space-y-3">
        {issues.map((i) => (
          <div key={i.id} className="card-p hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <Link href={`/student/issues/${i.id}`} className="font-semibold hover:underline">{i.title}</Link>
                <div className="text-xs text-on-surface-variant mt-1 inline-flex items-center flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Icon.Filter className="w-3 h-3" strokeWidth={2} />
                    {i.category}
                  </span>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon.Departments className="w-3 h-3" strokeWidth={2} />
                    {i.department?.name || "Unrouted"}
                  </span>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon.Calendar className="w-3 h-3" strokeWidth={2} />
                    {fmtDate(i.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SLAPill createdAt={i.createdAt} priority={i.priority} status={i.status} resolvedAt={i.resolvedAt} />
                <Badge className={statusColor(i.status)}>{i.status}</Badge>
              </div>
            </div>
            <div className="mt-3">
              <LoopSteps steps={["Submitted","Received","Assigned","In Progress","Resolved","Verified"]}
                current={["SUBMITTED","RECEIVED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED"].indexOf(i.status)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
