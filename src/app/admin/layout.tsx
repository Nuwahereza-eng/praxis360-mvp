import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("ADMIN");
  return <AppShell role="ADMIN" userId={s.sub} userName={s.name}>{children}</AppShell>;
}
