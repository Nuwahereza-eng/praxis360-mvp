import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsers() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({ include: { department: true, faculty: true }, orderBy: [{ role: "asc" }, { firstName: "asc" }] });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.firstName} {u.lastName}</td>
                <td className="font-mono text-xs">{u.email}</td>
                <td>{u.role}</td>
                <td>{u.department?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
