"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { AIService } from "@/lib/ai";
import { PrivacyMode } from "@/lib/enums";
import { redirect } from "next/navigation";

export async function classifyPreviewAction(title: string, description: string) {
  return AIService.classifyIssue(title, description);
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

  if (!title || !description) redirect("/student/issues/new");

  // Route to department; fall back to QA triage if not found.
  const dept =
    (await prisma.department.findUnique({ where: { code: routeCode } })) ||
    (await prisma.department.findUnique({ where: { code: "QA" } }));

  // Assign to any officer in the department (first found), if available.
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

  // Notify officer
  if (officer) {
    await prisma.notification.create({
      data: {
        userId: officer.id,
        title: "New issue assigned",
        message: `${title} — priority ${priority}`,
        type: "ISSUE",
        relatedEntityType: "ISSUE",
        relatedEntityId: issue.id,
      },
    });
  }

  redirect(`/student/issues/${issue.id}`);
}
