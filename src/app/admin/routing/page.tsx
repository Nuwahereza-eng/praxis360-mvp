import { requireRole } from "@/lib/auth";
import { ROUTING_MAP } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

export default async function AdminRouting() {
  await requireRole("ADMIN");
  const deps = await prisma.department.findMany();
  const nameByCode = new Map(deps.map((d) => [d.code, d.name] as const));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Routing Rules</h1>
      <p className="text-sm text-on-surface-variant">Category → Department mapping used by AI classification.</p>
      <div className="card">
        <table className="table">
          <thead><tr><th>Category</th><th>Routes to</th></tr></thead>
          <tbody>
            {Object.entries(ROUTING_MAP).map(([cat, code]) => (
              <tr key={cat}><td>{cat}</td><td>{nameByCode.get(code) || code}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
