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
  } else if (op === "ADD_ACTION") {
    const title = String(formData.get("actionTitle") || "").trim();
    const detail = String(formData.get("actionDetail") || "").trim() || null;
    if (title) {
      const count = await prisma.issueActionPoint.count({ where: { issueId } });
      const ap = await prisma.issueActionPoint.create({
        data: { issueId, title, detail: detail || undefined, createdById: me.id, orderIdx: count },
      });
      await prisma.issueUpdate.create({
        data: {
          issueId,
          authorId: me.id,
          message: `Action point added: ${title}`,
          type: "STUDENT_UPDATE",
          visibleToStudent: true,
        },
      });
      await notifyStudent(
        "New action point on your issue",
        `${me.firstName} added an action point: ${title}`,
      );
      // If this is the first action point, move issue to IN_PROGRESS automatically.
      if (count === 0 && issue.status !== "IN_PROGRESS" && issue.status !== "RESOLVED" && issue.status !== "VERIFIED") {
        await prisma.issue.update({ where: { id: issueId }, data: { status: "IN_PROGRESS" } });
      }
      void ap;
    }
  } else if (op === "SET_ACTION_STATUS") {
    const apId = String(formData.get("actionId") || "");
    const nextStatus = String(formData.get("actionStatus") || "");
    if (!apId || !["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"].includes(nextStatus)) return;
    const ap = await prisma.issueActionPoint.findUnique({ where: { id: apId } });
    if (!ap || ap.issueId !== issueId) return;
    await prisma.issueActionPoint.update({
      where: { id: apId },
      data: {
        status: nextStatus,
        completedAt: nextStatus === "DONE" ? new Date() : null,
      },
    });
    await prisma.issueUpdate.create({
      data: {
        issueId,
        authorId: me.id,
        message: `Action “${ap.title}” marked ${nextStatus.toLowerCase().replace("_", " ")}.`,
        type: "STUDENT_UPDATE",
        visibleToStudent: true,
      },
    });
    await notifyStudent(
      "Action point updated",
      `“${ap.title}” is now ${nextStatus.toLowerCase().replace("_", " ")}.`,
    );
    // If all action points are DONE and issue isn't already resolved, prompt via status.
    const remaining = await prisma.issueActionPoint.count({ where: { issueId, status: { not: "DONE" } } });
    if (remaining === 0 && ["ASSIGNED", "IN_PROGRESS", "RECEIVED"].includes(issue.status)) {
      // Leave for officer to click Resolve, but leave a hint update.
      await prisma.issueUpdate.create({
        data: {
          issueId,
          authorId: me.id,
          message: "All action points completed. Case is ready to be marked resolved.",
          type: "NOTE",
          visibleToStudent: false,
        },
      });
    }
  } else if (op === "DELETE_ACTION") {
    const apId = String(formData.get("actionId") || "");
    const ap = await prisma.issueActionPoint.findUnique({ where: { id: apId } });
    if (ap && ap.issueId === issueId) {
      await prisma.issueActionPoint.delete({ where: { id: apId } });
    }
  }

  revalidatePath(`/department/cases/${issueId}`);
  revalidatePath(`/department/cases`);
  revalidatePath(`/department`);
  revalidatePath(`/student/issues/${issueId}`);
  revalidatePath(`/student/issues`);
}
