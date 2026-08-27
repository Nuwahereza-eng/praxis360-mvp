import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDepartments() {
  await requireRole("ADMIN");
  const faculties = await prisma.faculty.findMany({ include: { departments: true } });
  const orphans = await prisma.department.findMany({ where: { facultyId: null } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Faculties & Departments</h1>
      {faculties.map((f) => (
        <div key={f.id} className="card-p">
          <div className="font-semibold">{f.name} <span className="text-on-surface-variant text-xs">({f.code})</span></div>
          <ul className="mt-2 space-y-1 text-sm">
            {f.departments.map((d) => <li key={d.id}>• {d.name} <span className="text-on-surface-variant">({d.code} · {d.type})</span></li>)}
          </ul>
        </div>
      ))}
      <div className="card-p">
        <div className="font-semibold">Service Departments</div>
        <ul className="mt-2 space-y-1 text-sm">
          {orphans.map((d) => <li key={d.id}>• {d.name} <span className="text-on-surface-variant">({d.code})</span></li>)}
        </ul>
      </div>
    </div>
  );
}
