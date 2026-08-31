import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { renderNotificationEmail, sendMail } from "@/lib/mail";

export type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  actionUrl?: string;
  actionLabel?: string;
  emailSubjectOverride?: string;
};

/**
 * Create an in-app notification and, if email is enabled globally,
 * dispatch an email to the user asynchronously (best-effort).
 */
export async function notifyUser(input: NotifyInput) {
  const notif = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    },
  });

  const settings = await getSettings();
  if (!settings.emailEnabled) return notif;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, firstName: true, lastName: true },
  });
  if (!user?.email) return notif;

  const html = renderNotificationEmail({
    institutionName: settings.institutionName,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel,
    recipientName: `${user.firstName} ${user.lastName}`.trim(),
  });

  // Fire and forget — never block the caller on email
  sendMail({
    to: user.email,
    subject: input.emailSubjectOverride ?? `[${settings.institutionName}] ${input.title}`,
    html,
  }).catch((e) => console.error("[notify] email dispatch failed", e));

  return notif;
}

export async function notifyMany(inputs: NotifyInput[]) {
  return Promise.all(inputs.map(notifyUser));
}
