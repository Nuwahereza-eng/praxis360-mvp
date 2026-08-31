import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtDate } from "@/lib/utils";
import { createTemplateAction, deleteTemplateAction } from "./actions";

export default async function RubricTemplates() {
  const s = await requireRole("LECTURER");
  const templates = await prisma.rubricTemplate.findMany({
    where: { ownerId: s.sub },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { criteria: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 bg-gradient-to-br from-secondary via-secondary to-tertiary text-on-secondary shadow-card">
        <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">📐 Rubric Library</div>
        <h1 className="text-2xl font-bold mt-1">Reusable marking templates</h1>
        <p className="text-sm opacity-90 mt-1">
          Build a rubric once, apply it to any assessment. Consistent, fair, fast.
        </p>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Create new template</div>
        <form action={createTemplateAction} className="grid gap-3 md:grid-cols-3">
          <input
            className="input md:col-span-1"
            name="name"
            placeholder="Template name (e.g. Standard essay rubric)"
            required
            maxLength={80}
          />
          <input
            className="input md:col-span-1"
            name="description"
            placeholder="Short description (optional)"
            maxLength={200}
          />
          <button className="btn-primary" type="submit">+ Create template</button>
        </form>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Your templates ({templates.length})</div>
        {templates.length === 0 ? (
          <div className="text-sm text-on-surface-variant py-6 text-center">
            No templates yet. Create your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {templates.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/lecturer/rubrics/${t.id}`} className="font-semibold hover:underline">
                    {t.name}
                  </Link>
                  {t.description && (
                    <div className="text-xs text-on-surface-variant mt-0.5 truncate">{t.description}</div>
                  )}
                  <div className="text-xs text-on-surface-variant mt-1">
                    {t._count.criteria} criteria • Updated {fmtDate(t.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/lecturer/rubrics/${t.id}`} className="btn-outline text-sm">Edit</Link>
                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-outline text-sm text-error" type="submit">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
