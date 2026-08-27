import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function DepartmentLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("DEPARTMENT_OFFICER");
  return <AppShell role="DEPARTMENT_OFFICER" userId={s.sub} userName={s.name}>{children}</AppShell>;
}
