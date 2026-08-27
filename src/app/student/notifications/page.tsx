import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/utils";
import { markAllReadAction } from "./actions";

export default async function StudentNotifications() {
  const s = await requireUser();
  const list = await prisma.notification.findMany({ where: { userId: s.sub }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <form action={markAllReadAction}><button className="btn-outline">Mark all read</button></form>
      </div>
      {list.length === 0 && <div className="card-p">No notifications.</div>}
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id} className={"card-p " + (n.read ? "opacity-70" : "")}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs text-on-surface-variant">{fmtDateTime(n.createdAt)}</div>
            </div>
            <p className="text-sm mt-1">{n.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
