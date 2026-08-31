import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, LoopSteps, SLAPill } from "@/components/ui";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Issues</h1>
        <div className="flex gap-2">
          <Link href="/student/issues/board" className="btn-outline">Community board</Link>
          <Link href="/student/issues/new" className="btn-primary">Raise an Issue</Link>
        </div>
      </div>
      {issues.length === 0 && <div className="card-p">You haven&apos;t raised any issues yet.</div>}
      <div className="space-y-3">
        {issues.map((i) => (
          <div key={i.id} className="card-p">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/student/issues/${i.id}`} className="font-semibold hover:underline">{i.title}</Link>
                <div className="text-xs text-on-surface-variant">{i.category} • {i.department?.name || "Unrouted"} • {fmtDate(i.createdAt)}</div>
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
