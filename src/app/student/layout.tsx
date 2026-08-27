import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("STUDENT");
  return (
    <AppShell role="STUDENT" userId={s.sub} userName={s.name}>
      {children}
    </AppShell>
  );
}
