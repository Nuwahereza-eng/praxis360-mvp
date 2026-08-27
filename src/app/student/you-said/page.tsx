import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export default async function YouSaidWeDid() {
  await requireUser();
  const actions = await prisma.institutionalAction.findMany({
    where: { published: true },
    include: { responsibleDepartment: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">You Said → We Did</h1>
        <p className="text-on-surface-variant text-sm">Institutional improvements driven by student voice.</p>
      </div>
      {actions.length === 0 && <div className="card-p">No published actions yet.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map((a) => (
          <div key={a.id} className="card-p space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-on-surface-variant">
                {a.responsibleDepartment?.name || "Institution"} • {fmtDate(a.createdAt)}
              </div>
              <Badge className={a.status === "COMPLETED" ? "bg-success-container text-success" : "bg-info-container text-info"}>{a.status}</Badge>
            </div>
            <div className="font-semibold text-lg">{a.title}</div>
            <div>
              <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">You said</div>
              <p className="text-sm">{a.issueSummary}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">We did</div>
              <p className="text-sm">{a.actionTaken}</p>
            </div>
            {a.outcome && (
              <div>
                <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">Impact</div>
                <p className="text-sm">{a.outcome}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
