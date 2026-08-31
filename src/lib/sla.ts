// Service Level Agreement rules for issue resolution.
// Targets are relative to issue creation time and depend on priority.

export type SLAState = "on-track" | "watch" | "warning" | "breached" | "resolved";

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 24,
  HIGH: 48,
  MEDIUM: 5 * 24,
  LOW: 10 * 24,
};

export function slaTargetHours(priority: string) {
  return SLA_HOURS[priority?.toUpperCase()] ?? SLA_HOURS.MEDIUM;
}

export function slaDueDate(createdAt: Date, priority: string) {
  const hours = slaTargetHours(priority);
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

export function slaStatus(params: {
  createdAt: Date;
  priority: string;
  status: string;
  resolvedAt?: Date | null;
  now?: Date;
}): { state: SLAState; percent: number; label: string; hoursLeft: number; due: Date } {
  const now = params.now ?? new Date();
  const target = slaTargetHours(params.priority);
  const due = slaDueDate(params.createdAt, params.priority);
  const isDone = ["RESOLVED", "VERIFIED"].includes(params.status);

  if (isDone) {
    return {
      state: "resolved",
      percent: 100,
      label: "Resolved",
      hoursLeft: 0,
      due,
    };
  }

  const elapsedMs = now.getTime() - params.createdAt.getTime();
  const totalMs = target * 60 * 60 * 1000;
  const percent = Math.min(200, (elapsedMs / totalMs) * 100);
  const hoursLeft = Math.round((due.getTime() - now.getTime()) / (60 * 60 * 1000));

  let state: SLAState;
  if (percent >= 100) state = "breached";
  else if (percent >= 80) state = "warning";
  else if (percent >= 50) state = "watch";
  else state = "on-track";

  let label: string;
  if (state === "breached") {
    label = `Overdue by ${formatHoursSpan(-hoursLeft)}`;
  } else if (hoursLeft < 24) {
    label = `${hoursLeft}h left`;
  } else {
    const days = Math.ceil(hoursLeft / 24);
    label = `${days} day${days === 1 ? "" : "s"} left`;
  }

  return { state, percent, label, hoursLeft, due };
}

function formatHoursSpan(hrs: number) {
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const rem = hrs % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

export function slaPillClass(state: SLAState) {
  switch (state) {
    case "resolved":
      return "bg-success-container text-success";
    case "breached":
      return "bg-error text-white";
    case "warning":
      return "bg-error-container text-error";
    case "watch":
      return "bg-warning-container text-warning";
    default:
      return "bg-info-container text-info";
  }
}

export function slaShortLabel(state: SLAState) {
  switch (state) {
    case "resolved": return "SLA met";
    case "breached": return "SLA breached";
    case "warning": return "SLA at risk";
    case "watch": return "SLA mid";
    default: return "SLA on track";
  }
}
