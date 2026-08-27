"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function verifyIssueAction(formData: FormData) {
  const s = await requireRole("STUDENT");
  const issueId = String(formData.get("issueId"));
  const response = String(formData.get("response"));
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue || issue.studentId !== s.sub) return;

  if (response === "YES") {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "VERIFIED" } });
    await prisma.issueUpdate.create({
      data: { issueId, authorId: s.sub, message: "Student confirmed resolution.", type: "VERIFICATION", visibleToStudent: true },
    });
  } else if (response === "PARTIAL") {
    await prisma.issueUpdate.create({
      data: { issueId, authorId: s.sub, message: "Student says the resolution was partial.", type: "VERIFICATION", visibleToStudent: true },
    });
  } else {
    await prisma.issue.update({ where: { id: issueId }, data: { status: "REOPENED" } });
    await prisma.issueUpdate.create({
      data: { issueId, authorId: s.sub, message: "Student reopened the issue.", type: "STATUS_CHANGE", visibleToStudent: true },
    });
    if (issue.assignedOfficerId) {
      await prisma.notification.create({
        data: { userId: issue.assignedOfficerId, title: "Issue reopened", message: issue.title, type: "ISSUE", relatedEntityType: "ISSUE", relatedEntityId: issueId },
      });
    }
  }
  revalidatePath(`/student/issues/${issueId}`);
}
