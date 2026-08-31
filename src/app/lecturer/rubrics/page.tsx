import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtDate } from "@/lib/utils";
import { PageHero, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
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
      <PageHero
        eyebrow="Rubric library"
        title="Reusable marking templates"
        subtitle="Build a rubric once, apply it to any assessment. Consistent, fair, fast."
        icon={Icon.Rubric}
        variant="secondary"
      />

      <div className="card-p">
        <SectionHeader title="Create new template" icon={Icon.Plus} />
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
          <button className="btn-primary inline-flex items-center gap-1.5" type="submit">
            <Icon.Plus className="w-4 h-4" strokeWidth={2} />
            Create template
          </button>
        </form>
      </div>

      <div className="card-p">
        <SectionHeader title={`Your templates (${templates.length})`} icon={Icon.Templates} />
        {templates.length === 0 ? (
          <div className="text-sm text-on-surface-variant py-6 text-center">
            No templates yet. Create your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {templates.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-container text-secondary grid place-items-center shrink-0">
                    <Icon.Rubric className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/lecturer/rubrics/${t.id}`} className="font-semibold hover:underline">
                      {t.name}
                    </Link>
                    {t.description && (
                      <div className="text-xs text-on-surface-variant mt-0.5 truncate">{t.description}</div>
                    )}
                    <div className="text-xs text-on-surface-variant mt-1 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Icon.Rubric className="w-3 h-3" strokeWidth={2} />
                        {t._count.criteria} criteria
                      </span>
                      <span aria-hidden>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Icon.Clock className="w-3 h-3" strokeWidth={2} />
                        Updated {fmtDate(t.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/lecturer/rubrics/${t.id}`} className="btn-outline text-sm inline-flex items-center gap-1.5">
                    <Icon.Edit className="w-3.5 h-3.5" strokeWidth={2} />
                    Edit
                  </Link>
                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-outline text-sm text-error inline-flex items-center gap-1.5" type="submit">
                      <Icon.Trash className="w-3.5 h-3.5" strokeWidth={2} />
                      Delete
                    </button>
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
