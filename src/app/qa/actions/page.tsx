import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { createActionAction, publishToggleAction, updateStatusAction } from "./actions";

export default async function QAActions() {
  await requireRole("QA");
  const [actions, departments] = await Promise.all([
    prisma.institutionalAction.findMany({ include: { responsibleDepartment: true }, orderBy: { createdAt: "desc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Institutional Actions</h1>
      <div className="card-p">
        <div className="section-title mb-3">Create a new action</div>
        <form action={createActionAction} className="grid md:grid-cols-2 gap-3">
          <div><label className="label">Title</label><input name="title" className="input" required /></div>
          <div>
            <label className="label">Responsible department</label>
            <select name="departmentId" className="input">
              <option value="">—</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Problem (issue summary)</label><textarea name="issueSummary" className="input" required /></div>
          <div className="md:col-span-2"><label className="label">Evidence</label><textarea name="evidence" className="input" required /></div>
          <div className="md:col-span-2"><label className="label">Action taken</label><textarea name="actionTaken" className="input" required /></div>
          <div className="md:col-span-2"><label className="label">Outcome (optional)</label><textarea name="outcome" className="input" /></div>
          <div className="md:col-span-2"><button className="btn-primary">Create action</button></div>
        </form>
      </div>

      <div className="space-y-3">
        {actions.map((a) => (
          <div key={a.id} className="card-p">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-on-surface-variant">
                  {a.responsibleDepartment?.name || "—"} • {fmtDate(a.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={a.status === "COMPLETED" ? "bg-success-container text-success" : "bg-info-container text-info"}>{a.status}</Badge>
                <Badge className={a.published ? "bg-success-container text-success" : "bg-surface-container text-on-surface-variant"}>{a.published ? "Published" : "Draft"}</Badge>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
              <div><div className="text-xs uppercase text-on-surface-variant">You said</div><p>{a.issueSummary}</p></div>
              <div><div className="text-xs uppercase text-on-surface-variant">We did</div><p>{a.actionTaken}</p></div>
              <div><div className="text-xs uppercase text-on-surface-variant">Impact</div><p>{a.outcome || "—"}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={publishToggleAction}>
                <input type="hidden" name="id" value={a.id} />
                <button className="btn-outline text-xs">{a.published ? "Unpublish" : "Publish to You Said → We Did"}</button>
              </form>
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={a.id} />
                <select name="status" defaultValue={a.status} className="input text-xs py-1">
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                <button className="btn-outline text-xs">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
