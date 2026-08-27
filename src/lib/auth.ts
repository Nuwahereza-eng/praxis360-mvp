import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "./enums";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "praxis360-demo-secret");
const COOKIE = "praxis360_session";
const ALG = "HS256";

export type SessionPayload = {
  sub: string; // user id
  role: Role;
  email: string;
  name: string;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireRole(...roles: Role[]) {
  const s = await requireUser();
  if (!roles.includes(s.role)) redirect("/unauthorized");
  return s;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({
    where: { id: s.sub },
    include: { faculty: true, department: true },
  });
}

export function roleHome(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "LECTURER":
      return "/lecturer";
    case "DEPARTMENT_OFFICER":
      return "/department";
    case "QA":
      return "/qa";
    case "ADMIN":
      return "/admin";
  }
}
