import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCriterionAction,
  deleteCriterionAction,
  updateTemplateAction,
} from "../actions";

export default async function EditRubricTemplate({ params }: { params: { id: string } }) {
  const s = await requireRole("LECTURER");
  const template = await prisma.rubricTemplate.findUnique({
    where: { id: params.id },
    include: { criteria: { orderBy: { orderIdx: "asc" } } },
  });
  if (!template || template.ownerId !== s.sub) notFound();

  const totalMarks = template.criteria.reduce((s, c) => s + c.maxMarks, 0);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/lecturer/rubrics" className="link text-sm">← All templates</Link>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Template details</div>
        <form action={updateTemplateAction} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="id" value={template.id} />
          <input
            className="input md:col-span-1"
            name="name"
            defaultValue={template.name}
            required
            maxLength={80}
          />
          <input
            className="input md:col-span-1"
            name="description"
            defaultValue={template.description || ""}
            placeholder="Short description"
            maxLength={200}
          />
          <button className="btn-primary" type="submit">Save details</button>
        </form>
        <div className="text-xs text-on-surface-variant mt-2">
          Total marks across criteria: <b>{totalMarks}</b>
        </div>
      </div>

      <div className="card-p">
        <div className="section-title mb-3">Criteria ({template.criteria.length})</div>
        {template.criteria.length === 0 ? (
          <div className="text-sm text-on-surface-variant py-4 text-center">
            No criteria yet — add your first one below.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant mb-4">
            {template.criteria.map((c) => (
              <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.title}</span>
                    <span className="badge bg-surface-container text-on-surface-variant">{c.maxMarks} marks</span>
                  </div>
                  {c.description && (
                    <div className="text-sm text-on-surface-variant mt-1">{c.description}</div>
                  )}
                </div>
                <form action={deleteCriterionAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn-outline text-sm text-error" type="submit">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addCriterionAction} className="grid gap-2 md:grid-cols-4 border-t border-outline-variant pt-4">
          <input type="hidden" name="templateId" value={template.id} />
          <input
            className="input md:col-span-1"
            name="title"
            placeholder="Criterion title"
            required
            maxLength={80}
          />
          <input
            className="input md:col-span-2"
            name="description"
            placeholder="Description (what does 'good' look like?)"
            maxLength={300}
          />
          <div className="flex gap-2">
            <input
              className="input flex-1"
              name="maxMarks"
              type="number"
              defaultValue={10}
              min={1}
              max={100}
              required
            />
            <button className="btn-primary" type="submit">+ Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
