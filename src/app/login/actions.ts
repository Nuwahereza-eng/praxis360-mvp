"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, roleHome, verifyPassword } from "@/lib/auth";
import type { Role } from "@/lib/enums";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=1");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login?error=1");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) redirect("/login?error=1");

  await createSession({
    sub: user.id,
    role: user.role as Role,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  });
  redirect(roleHome(user.role as Role));
}

// One-click demo login by role. Signs in as the canonical demo account
// for that role (falls back to any user with the role). Demo-only.
export async function quickLoginAction(formData: FormData) {
  const role = String(formData.get("role") || "") as Role;
  const validRoles: Role[] = ["STUDENT", "LECTURER", "DEPARTMENT_OFFICER", "QA", "ADMIN"];
  if (!validRoles.includes(role)) redirect("/login?error=1");

  const canonicalEmail: Partial<Record<Role, string>> = {
    STUDENT: "student@umi.ac.ug",
    LECTURER: "lecturer@umi.ac.ug",
    DEPARTMENT_OFFICER: "ict@umi.ac.ug",
    QA: "qa@umi.ac.ug",
    ADMIN: "admin@umi.ac.ug",
  };

  const user =
    (canonicalEmail[role]
      ? await prisma.user.findUnique({ where: { email: canonicalEmail[role]! } })
      : null) ?? (await prisma.user.findFirst({ where: { role } }));

  if (!user) redirect("/login?error=1");

  await createSession({
    sub: user.id,
    role: user.role as Role,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  });
  redirect(roleHome(user.role as Role));
}
