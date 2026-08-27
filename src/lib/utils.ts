import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function pct(n: number, digits = 0) {
  return `${n.toFixed(digits)}%`;
}

export function severityColor(sev: string) {
  switch (sev) {
    case "RED":
    case "CRITICAL":
    case "HIGH":
      return "bg-error-container text-on-error-container";
    case "AMBER":
    case "MEDIUM":
      return "bg-warning-container text-warning";
    case "GREEN":
    case "LOW":
      return "bg-success-container text-success";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

export function statusColor(status: string) {
  switch (status) {
    case "RESOLVED":
    case "VERIFIED":
    case "RECOVERED":
    case "RELEASED":
      return "bg-success-container text-success";
    case "IN_PROGRESS":
    case "REASSESSED":
    case "ASSIGNED":
    case "RECEIVED":
      return "bg-info-container text-info";
    case "ESCALATED":
    case "NEEDS_INTERVENTION":
    case "REOPENED":
      return "bg-error-container text-on-error-container";
    case "SUBMITTED":
    case "IDENTIFIED":
    case "PENDING":
    case "MARKED":
      return "bg-warning-container text-warning";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}
