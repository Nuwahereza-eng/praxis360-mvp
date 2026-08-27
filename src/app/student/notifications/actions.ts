"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAllReadAction() {
  const s = await requireUser();
  await prisma.notification.updateMany({ where: { userId: s.sub, read: false }, data: { read: true } });
  revalidatePath("/student/notifications");
  revalidatePath("/lecturer/notifications");
  revalidatePath("/department");
  revalidatePath("/qa");
}
