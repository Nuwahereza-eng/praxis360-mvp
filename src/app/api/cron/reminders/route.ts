import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { notifyUser } from "@/lib/notify";
import { slaStatus } from "@/lib/sla";

// GET /api/cron/reminders
// Header: X-Cron-Key: <CRON_SECRET>
// Or: authenticated ADMIN session cookie (see /admin/settings "Run reminders now")
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-cron-key");
  const authorized = process.env.CRON_SECRET && key === process.env.CRON_SECRET;
  if (!authorized) {
    // Fall back to admin session — imported dynamically to avoid pulling auth into every edge
    const { getSession } = await import("@/lib/auth");
    const s = await getSession();
    if (!s || s.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await getSettings();
  const results = { slaWarn: 0, slaBreach: 0, evalDeadline: 0, skipped: 0 };
  const now = new Date();
  const cooldownMs = Math.max(1, settings.reminderCooldownHours) * 3600_000;

  // -- SLA reminders --------------------------------------------------------
  if (settings.reminderSlaEnabled) {
    const openIssues = await prisma.issue.findMany({
      where: {
        status: { notIn: ["RESOLVED", "VERIFIED", "CLOSED"] },
        assignedOfficerId: { not: null },
      },
      select: {
        id: true, title: true, createdAt: true, priority: true, status: true, resolvedAt: true,
        assignedOfficerId: true,
      },
    });

    for (const iss of openIssues) {
      const sla = slaStatus({
        createdAt: iss.createdAt,
        priority: iss.priority,
        status: iss.status,
        resolvedAt: iss.resolvedAt,
        now,
      });
      const isWarn = sla.state === "warning" || sla.percent >= settings.slaWarnPercent;
      const isBreach = sla.state === "breached";
      if (!isWarn && !isBreach) continue;
      const kind = isBreach ? "SLA_BREACH" : "SLA_WARN";
      const officerId = iss.assignedOfficerId!;

      const recent = await prisma.reminderLog.findFirst({
        where: {
          kind,
          entityType: "ISSUE",
          entityId: iss.id,
          userId: officerId,
          sentAt: { gt: new Date(now.getTime() - cooldownMs) },
        },
      });
      if (recent) { results.skipped++; continue; }

      const title = isBreach ? "SLA breached" : "SLA nearing breach";
      const message = isBreach
        ? `"${iss.title}" has breached its SLA target (${sla.percent}% of target elapsed).`
        : `"${iss.title}" is ${sla.percent}% through its SLA window. Please take action.`;

      await notifyUser({
        userId: officerId,
        title,
        message,
        type: "SLA",
        relatedEntityType: "ISSUE",
        relatedEntityId: iss.id,
        actionUrl: `${process.env.APP_URL ?? ""}/department/cases/${iss.id}`,
        actionLabel: "Open case",
      });
      await prisma.reminderLog.create({
        data: { kind, entityType: "ISSUE", entityId: iss.id, userId: officerId },
      });
      if (isBreach) results.slaBreach++; else results.slaWarn++;
    }
  }

  // -- Evaluation deadline reminders ---------------------------------------
  if (settings.reminderEvaluationEnabled) {
    const daysBefore = Math.max(1, settings.reminderEvaluationDaysBefore);
    const windowEnd = new Date(now.getTime() + daysBefore * 24 * 3600_000);
    const semesters = await prisma.semester.findMany({
      where: {
        status: "ACTIVE",
        evaluationEndDate: { gt: now, lte: windowEnd },
      },
      include: { courses: { include: { enrollments: true } } },
    });

    for (const sem of semesters) {
      for (const course of sem.courses) {
        for (const enr of course.enrollments) {
          const already = await prisma.evaluationResponse.count({
            where: { studentId: enr.studentId, courseId: course.id },
          });
          if (already > 0) continue;
          const recent = await prisma.reminderLog.findFirst({
            where: {
              kind: "EVAL_DEADLINE",
              entityType: "COURSE_EVAL",
              entityId: course.id,
              userId: enr.studentId,
              sentAt: { gt: new Date(now.getTime() - cooldownMs) },
            },
          });
          if (recent) { results.skipped++; continue; }

          const daysLeft = Math.max(1, Math.ceil((sem.evaluationEndDate.getTime() - now.getTime()) / (24 * 3600_000)));
          await notifyUser({
            userId: enr.studentId,
            title: "Evaluation window closing",
            message: `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to evaluate ${course.name}. Your voice matters — it stays anonymous.`,
            type: "EVALUATION",
            relatedEntityType: "COURSE",
            relatedEntityId: course.id,
            actionUrl: `${process.env.APP_URL ?? ""}/student/evaluations/${course.id}`,
            actionLabel: "Evaluate now",
          });
          await prisma.reminderLog.create({
            data: {
              kind: "EVAL_DEADLINE",
              entityType: "COURSE_EVAL",
              entityId: course.id,
              userId: enr.studentId,
            },
          });
          results.evalDeadline++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
