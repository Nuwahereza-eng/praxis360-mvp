// Shared enum-like string unions used across the Praxis360 app.
// Prisma uses SQLite so these are stored as strings.

export const Roles = {
  STUDENT: "STUDENT",
  LECTURER: "LECTURER",
  DEPARTMENT_OFFICER: "DEPARTMENT_OFFICER",
  QA: "QA",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Roles)[keyof typeof Roles];

export const IssueStatus = {
  SUBMITTED: "SUBMITTED",
  RECEIVED: "RECEIVED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED",
  VERIFIED: "VERIFIED",
  REOPENED: "REOPENED",
} as const;
export type IssueStatusT = (typeof IssueStatus)[keyof typeof IssueStatus];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const PrivacyMode = {
  IDENTIFIED: "IDENTIFIED",
  CONFIDENTIAL: "CONFIDENTIAL",
  ANONYMOUS: "ANONYMOUS",
} as const;

export const GapStatus = {
  IDENTIFIED: "IDENTIFIED",
  IN_PROGRESS: "IN_PROGRESS",
  REASSESSED: "REASSESSED",
  RECOVERED: "RECOVERED",
  NEEDS_INTERVENTION: "NEEDS_INTERVENTION",
} as const;

export const ResultStatus = {
  PENDING: "PENDING",
  MARKED: "MARKED",
  RELEASED: "RELEASED",
} as const;

export const ISSUE_CATEGORIES = [
  "Academic",
  "Assessment",
  "ICT",
  "Library",
  "Finance",
  "Registration",
  "Administration",
  "Facilities",
  "Student Welfare",
  "Accommodation",
  "Security",
  "Other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

// Category -> service department code used for routing
export const ROUTING_MAP: Record<string, string> = {
  ICT: "ICT",
  Library: "LIB",
  Finance: "FIN",
  Registration: "REG",
  Facilities: "FAC",
  "Student Welfare": "STA",
  Accommodation: "STA",
  Security: "SEC",
  Administration: "ADM",
  Academic: "SE", // Falls back to a default academic dept in seed
  Assessment: "SE",
  Other: "QA",
};
