"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { invalidateSettingsCache } from "@/lib/settings";
import { testMail } from "@/lib/mail";

function toBool(v: FormDataEntryValue | null) { return v === "on" || v === "true" || v === "1"; }
function toIntOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
function toStrOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

const SINGLETON_WHERE = { id: "singleton" as const };

async function ensureSettings() {
  const existing = await prisma.systemSettings.findFirst();
  if (existing) return existing;
  return prisma.systemSettings.create({ data: { id: "singleton" } });
}

export async function saveBrandingAction(formData: FormData) {
  await requireRole("ADMIN");
  await ensureSettings();
  await prisma.systemSettings.update({
    where: SINGLETON_WHERE,
    data: {
      institutionName: String(formData.get("institutionName") || "Praxis360 Institute").trim() || "Praxis360 Institute",
      primaryContactEmail: toStrOrNull(formData.get("primaryContactEmail")),
    },
  });
  invalidateSettingsCache();
  revalidatePath("/admin/settings");
}

export async function saveEmailAction(formData: FormData) {
  await requireRole("ADMIN");
  await ensureSettings();
  await prisma.systemSettings.update({
    where: SINGLETON_WHERE,
    data: {
      emailEnabled: toBool(formData.get("emailEnabled")),
      smtpHost: toStrOrNull(formData.get("smtpHost")),
      smtpPort: toIntOrNull(formData.get("smtpPort")),
      smtpSecure: toBool(formData.get("smtpSecure")),
      smtpUser: toStrOrNull(formData.get("smtpUser")),
      smtpPass: toStrOrNull(formData.get("smtpPass")),
      emailFromName: String(formData.get("emailFromName") || "Praxis360").trim() || "Praxis360",
      emailFromAddress: toStrOrNull(formData.get("emailFromAddress")),
    },
  });
  invalidateSettingsCache();
  revalidatePath("/admin/settings");
}

export async function saveSlaAction(formData: FormData) {
  await requireRole("ADMIN");
  await ensureSettings();
  await prisma.systemSettings.update({
    where: SINGLETON_WHERE,
    data: {
      slaCriticalHours: toIntOrNull(formData.get("slaCriticalHours")) ?? 24,
      slaHighHours: toIntOrNull(formData.get("slaHighHours")) ?? 48,
      slaMediumHours: toIntOrNull(formData.get("slaMediumHours")) ?? 120,
      slaLowHours: toIntOrNull(formData.get("slaLowHours")) ?? 240,
      slaWarnPercent: Math.min(100, Math.max(1, toIntOrNull(formData.get("slaWarnPercent")) ?? 75)),
    },
  });
  invalidateSettingsCache();
  revalidatePath("/admin/settings");
}

export async function saveRemindersAction(formData: FormData) {
  await requireRole("ADMIN");
  await ensureSettings();
  await prisma.systemSettings.update({
    where: SINGLETON_WHERE,
    data: {
      reminderSlaEnabled: toBool(formData.get("reminderSlaEnabled")),
      reminderEvaluationEnabled: toBool(formData.get("reminderEvaluationEnabled")),
      reminderEvaluationDaysBefore: Math.max(1, toIntOrNull(formData.get("reminderEvaluationDaysBefore")) ?? 3),
      reminderCooldownHours: Math.max(1, toIntOrNull(formData.get("reminderCooldownHours")) ?? 24),
    },
  });
  invalidateSettingsCache();
  revalidatePath("/admin/settings");
}

export async function saveFeaturesAction(formData: FormData) {
  await requireRole("ADMIN");
  await ensureSettings();
  await prisma.systemSettings.update({
    where: SINGLETON_WHERE,
    data: {
      aiEnabled: toBool(formData.get("aiEnabled")),
      communityBoardEnabled: toBool(formData.get("communityBoardEnabled")),
      voiceEnabled: toBool(formData.get("voiceEnabled")),
      duplicateDetectionEnabled: toBool(formData.get("duplicateDetectionEnabled")),
    },
  });
  invalidateSettingsCache();
  revalidatePath("/admin/settings");
}

export async function testEmailAction(formData: FormData) {
  await requireRole("ADMIN");
  const to = String(formData.get("testEmailTo") || "").trim();
  if (!to) return;
  await testMail(to);
  revalidatePath("/admin/settings");
}

export async function runRemindersAction() {
  await requireRole("ADMIN");
  const base = process.env.APP_URL || "";
  const url = `${base}/api/cron/reminders`;
  try {
    // Call our own endpoint using the admin session by passing the cookies
    const { cookies } = await import("next/headers");
    const cookieHeader = cookies().toString();
    await fetch(url, { headers: { cookie: cookieHeader } });
  } catch (e) {
    console.error("[settings] runRemindersAction failed", e);
  }
  revalidatePath("/admin/settings");
}
