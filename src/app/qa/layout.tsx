import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function QALayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("QA");
  return <AppShell role="QA" userId={s.sub} userName={s.name}>{children}</AppShell>;
}
