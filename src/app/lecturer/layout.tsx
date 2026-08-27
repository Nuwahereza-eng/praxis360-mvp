import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("LECTURER");
  return <AppShell role="LECTURER" userId={s.sub} userName={s.name}>{children}</AppShell>;
}
