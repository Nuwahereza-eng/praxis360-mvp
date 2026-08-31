"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { AIService } from "@/lib/ai";
import { PrivacyMode } from "@/lib/enums";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB per file
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "application/pdf"];

export async function classifyPreviewAction(title: string, description: string) {
  return AIService.classifyIssue(title, description);
}

/**
 * Duplicate-detection: find recent public/community issues whose title or description
 * shares meaningful keywords with the draft. Returns top 5 with upvote counts.
 */
export async function findSimilarIssuesAction(
  title: string,
  description: string,
  category?: string,
) {
  await requireRole("STUDENT");
  const text = `${title} ${description}`.toLowerCase();
  const stop = new Set([
    "the","a","an","is","are","was","were","it","this","that","and","or","for","of","in","on","to","my","i",
    "we","you","have","has","been","not","no","but","with","at","by","from","as","be","so","if","cant",
    "cannot","doesnt","dont","also","just","some","any","there","because",
  ]);
  const tokens = Array.from(new Set(
    text
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stop.has(w))
  ));
  if (tokens.length === 0) return [];

  const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const candidates = await prisma.issue.findMany({
    where: {
      isPublic: true,
      createdAt: { gte: since },
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      department: true,
      _count: { select: { upvotes: true } },
    },
  });

  const scored = candidates.map((i) => {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    let hits = 0;
    for (const t of tokens) if (hay.includes(t)) hits++;
    return { issue: i, score: hits / Math.max(tokens.length, 1) };
  });

  return scored
    .filter((s) => s.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => ({
      id: s.issue.id,
      title: s.issue.title,
      category: s.issue.category,
      departmentName: s.issue.department?.name || "Unrouted",
      createdAt: s.issue.createdAt,
      status: s.issue.status,
      priority: s.issue.priority,
      upvotes: s.issue._count.upvotes,
      matchPct: Math.round(s.score * 100),
    }));
}

export async function submitIssueAction(formData: FormData) {
  const s = await requireRole("STUDENT");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "Other");
  const location = String(formData.get("location") || "").trim() || null;
  const privacy = String(formData.get("privacy") || PrivacyMode.IDENTIFIED);
  const issueType = String(formData.get("issueType") || "General");
  const priority = String(formData.get("priority") || "MEDIUM");
  const routeCode = String(formData.get("responsibleDepartmentCode") || "QA");
  const confidence = parseFloat(String(formData.get("confidence") || "0.7"));
  const isPublic = formData.get("isPublic") === "on" || formData.get("isPublic") === "true";

  if (!title || !description) redirect("/student/issues/new");

  const dept =
    (await prisma.department.findUnique({ where: { code: routeCode } })) ||
    (await prisma.department.findUnique({ where: { code: "QA" } }));

  const officer = dept
    ? await prisma.user.findFirst({ where: { departmentId: dept.id, role: "DEPARTMENT_OFFICER" } })
    : null;

  const issue = await prisma.issue.create({
    data: {
      studentId: privacy === PrivacyMode.ANONYMOUS ? null : s.sub,
      title,
      description,
      category,
      issueType,
      location,
      priority,
      privacyMode: privacy,
      isPublic,
      departmentId: dept?.id,
      assignedOfficerId: officer?.id,
      status: officer ? "ASSIGNED" : "RECEIVED",
      aiConfidence: confidence,
      updates: {
        create: [
          { message: "Issue submitted by student.", type: "STATUS_CHANGE", visibleToStudent: true },
          {
            message: `Routed to ${dept?.name || "QA triage"} based on AI classification (${category}).`,
            type: "STATUS_CHANGE",
            visibleToStudent: true,
          },
          ...(officer
            ? [{ message: `Assigned to ${officer.firstName} ${officer.lastName}.`, type: "STATUS_CHANGE" as const, visibleToStudent: true }]
            : []),
        ],
      },
    },
  });

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  let stored = 0;
  for (const f of files) {
    if (stored >= MAX_ATTACHMENTS) break;
    if (f.size > MAX_ATTACHMENT_BYTES) continue;
    if (!ALLOWED_MIME.includes(f.type)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const dataUrl = `data:${f.type};base64,${buf.toString("base64")}`;
    await prisma.issueAttachment.create({
      data: {
        issueId: issue.id,
        name: f.name.slice(0, 200),
        mimeType: f.type,
        size: f.size,
        dataUrl,
        uploaderId: s.sub,
      },
    });
    stored++;
  }

  if (officer) {
    await notifyUser({
      userId: officer.id,
      title: "New issue assigned",
      message: `${title} — priority ${priority}${stored > 0 ? ` (${stored} attachment${stored === 1 ? "" : "s"})` : ""}`,
      type: "ISSUE",
      relatedEntityType: "ISSUE",
      relatedEntityId: issue.id,
      actionUrl: `${process.env.APP_URL ?? ""}/department/cases/${issue.id}`,
      actionLabel: "Open case",
    });
  }

  revalidatePath("/student/issues");
  revalidatePath("/student/issues/board");
  redirect(`/student/issues/${issue.id}`);
}

export async function upvoteIssueAction(formData: FormData) {
  const s = await requireRole("STUDENT");
  const issueId = String(formData.get("issueId") || "");
  if (!issueId) return;
  const existing = await prisma.issueUpvote.findUnique({
    where: { issueId_userId: { issueId, userId: s.sub } },
  });
  if (existing) {
    await prisma.issueUpvote.delete({ where: { id: existing.id } });
  } else {
    await prisma.issueUpvote.create({ data: { issueId, userId: s.sub } });
  }
  revalidatePath("/student/issues/board");
  revalidatePath(`/student/issues/${issueId}`);
  revalidatePath("/student/issues");
}
