"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function officerActionAction(formData: FormData) {
  const s = await requireRole("DEPARTMENT_OFFICER");
  const me = await prisma.user.findUnique({ where: { id: s.sub } });
  if (!me?.departmentId) return;
  const issueId = String(formData.get("issueId"));
  const op = String(formData.get("op"));
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue || issue.departmentId !== me.departmentId) return;

  const notifyStudent = async (title: string, message: string) => {
    if (issue.studentId) {
      await prisma.notification.create({
        data: { userId: issue.studentId, title, message, type: "ISSUE", relatedEntityType: "ISSUE", relatedEntityId: issueId },
      });
    }
  };

  if (op === "ACCEPT" || op === "ASSIGN_ME") {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "ASSIGNED", assignedOfficerId: me.id } });
    await prisma.issueUpdate.create({ data: { issueId, authorId: me.id, message: `Case accepted by ${me.firstName} ${me.lastName}.`, type: "STATUS_CHANGE", visibleToStudent: true } });
    await notifyStudent("Your issue is being handled", `${me.firstName} accepted your case.`);
  } else if (op === "IN_PROGRESS") {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "IN_PROGRESS" } });
    await prisma.issueUpdate.create({ data: { issueId, authorId: me.id, message: "Investigation in progress.", type: "STATUS_CHANGE", visibleToStudent: true } });
    await notifyStudent("Issue in progress", "Your issue is now being actively worked on.");
  } else if (op === "ESCALATE") {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "ESCALATED" } });
    await prisma.issueUpdate.create({ data: { issueId, authorId: me.id, message: "Case escalated for higher-level review.", type: "STATUS_CHANGE", visibleToStudent: true } });
    await notifyStudent("Issue escalated", "Your issue has been escalated for review.");
  } else if (op === "RESOLVE") {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "RESOLVED", resolvedAt: new Date() } });
    await prisma.issueUpdate.create({ data: { issueId, authorId: me.id, message: "Marked resolved by department. Awaiting student verification.", type: "RESOLUTION", visibleToStudent: true } });
    await notifyStudent("Issue resolved", "Please confirm whether your issue was resolved satisfactorily.");
  } else if (op === "ADD_UPDATE") {
    const message = String(formData.get("message") || "").trim();
    const internal = formData.get("internal") === "on";
    if (message) {
      await prisma.issueUpdate.create({
        data: { issueId, authorId: me.id, message, type: internal ? "NOTE" : "STUDENT_UPDATE", visibleToStudent: !internal },
      });
      if (!internal) await notifyStudent("New update on your issue", message.slice(0, 120));
    }
  }

  revalidatePath(`/department/cases/${issueId}`);
  revalidatePath(`/department/cases`);
  revalidatePath(`/department`);
}
