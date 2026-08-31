import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";
import { Icon, type LucideIcon } from "@/components/icons";

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student", icon: Icon.Dashboard },
    { label: "My Assessments", href: "/student/assessments", icon: Icon.Assessments },
    { label: "My Feedback", href: "/student/feedback", icon: Icon.Feedback },
    { label: "Learning Recovery", href: "/student/recovery", icon: Icon.Recovery },
    { label: "Raise an Issue", href: "/student/issues/new", icon: Icon.RaiseIssue },
    { label: "My Issues", href: "/student/issues", icon: Icon.MyIssues },
    { label: "Community Board", href: "/student/issues/board", icon: Icon.Community },
    { label: "Teaching Evaluations", href: "/student/evaluations", icon: Icon.Evaluations },
    { label: "You Said, We Did", href: "/student/you-said", icon: Icon.YouSaid },
    { label: "Notifications", href: "/student/notifications", icon: Icon.Bell },
  ],
  LECTURER: [
    { label: "Dashboard", href: "/lecturer", icon: Icon.Dashboard },
    { label: "Courses", href: "/lecturer/courses", icon: Icon.Courses },
    { label: "Assessments", href: "/lecturer/assessments", icon: Icon.MarkAssessment },
    { label: "Rubric Templates", href: "/lecturer/rubrics", icon: Icon.Rubric },
    { label: "Students at Risk", href: "/lecturer/at-risk", icon: Icon.AtRisk },
    { label: "Analytics", href: "/lecturer/analytics", icon: Icon.Analytics },
    { label: "Evaluation Results", href: "/lecturer/evaluations", icon: Icon.Star },
    { label: "Notifications", href: "/lecturer/notifications", icon: Icon.Bell },
  ],
  DEPARTMENT_OFFICER: [
    { label: "Dashboard", href: "/department", icon: Icon.Dashboard },
    { label: "All Cases", href: "/department/cases", icon: Icon.Cases },
    { label: "New", href: "/department/cases?status=SUBMITTED", icon: Icon.New },
    { label: "Assigned", href: "/department/cases?status=ASSIGNED", icon: Icon.Inbox },
    { label: "In Progress", href: "/department/cases?status=IN_PROGRESS", icon: Icon.InProgress },
    { label: "Resolved", href: "/department/cases?status=RESOLVED", icon: Icon.Resolved },
    { label: "Analytics", href: "/department/analytics", icon: Icon.Analytics },
  ],
  QA: [
    { label: "Intelligence", href: "/qa", icon: Icon.Dashboard },
    { label: "Assessment Feedback", href: "/qa/feedback", icon: Icon.Feedback },
    { label: "Teaching Evaluation", href: "/qa/evaluations", icon: Icon.Star },
    { label: "Evaluation Forms", href: "/qa/evaluations/form", icon: Icon.Edit },
    { label: "Student Voice", href: "/qa/voice", icon: Icon.Voice },
    { label: "Learning Analytics", href: "/qa/learning", icon: Icon.Learning },
    { label: "Institutional Actions", href: "/qa/actions", icon: Icon.Actions },
    { label: "Reports", href: "/qa/reports", icon: Icon.Reports },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: Icon.Dashboard },
    { label: "Users", href: "/admin/users", icon: Icon.User },
    { label: "Departments", href: "/admin/departments", icon: Icon.Departments },
    { label: "Courses", href: "/admin/courses", icon: Icon.Courses },
    { label: "Academic Calendar", href: "/admin/calendar", icon: Icon.Calendar },
    { label: "Evaluation Questions", href: "/admin/questions", icon: Icon.Questions },
    { label: "Routing Rules", href: "/admin/routing", icon: Icon.Routing },
    { label: "System Settings", href: "/admin/settings", icon: Icon.Actions },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  DEPARTMENT_OFFICER: "Department Officer",
  QA: "Quality Assurance",
  ADMIN: "Administrator",
};

export async function AppShell({
  role,
  userId,
  userName,
  children,
}: {
  role: Role;
  userId: string;
  userName: string;
  children: React.ReactNode;
}) {
  const unread = await prisma.notification.count({ where: { userId, read: false } });
  const nav = NAV[role];
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-[248px_1fr] bg-surface overflow-hidden">
      <aside className="hidden md:flex flex-col bg-primary text-on-primary h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-on-primary text-primary grid place-items-center font-bold text-lg tracking-tight">P</div>
            <div className="min-w-0">
              <div className="font-semibold leading-tight">Praxis360</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70 truncate">{ROLE_LABEL[role]}</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          {nav.map((item) => {
            const IconEl = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
              >
                <IconEl className="w-4 h-4 opacity-80 group-hover:opacity-100" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-white/15 grid place-items-center text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-[10px] opacity-70">{ROLE_LABEL[role]}</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition">
              <Icon.LogOut className="w-4 h-4" strokeWidth={2} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-col h-screen min-w-0 overflow-hidden">
        <header className="border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
            <div className="min-w-0">
              <div className="text-[10px] md:text-xs uppercase tracking-wide text-on-surface-variant font-semibold">{ROLE_LABEL[role]}</div>
              <div className="text-base md:text-lg font-semibold truncate">Welcome, {userName.split(" ")[0]}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`${roleBaseHref(role)}/notifications`}
                className="relative inline-flex items-center gap-1.5 btn-outline text-xs md:text-sm"
              >
                <Icon.Bell className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">Notifications</span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-error text-on-error rounded-full min-w-5 h-5 px-1 grid place-items-center font-bold">
                    {unread}
                  </span>
                )}
              </Link>
              <form action={logoutAction} className="md:hidden">
                <button className="btn-outline text-xs inline-flex items-center gap-1" type="submit">
                  <Icon.LogOut className="w-4 h-4" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden overflow-x-auto whitespace-nowrap border-t border-outline-variant px-3 py-2 flex gap-2">
            {nav.map((item) => {
              const IconEl = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface-container shrink-0"
                >
                  <IconEl className="w-3.5 h-3.5" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function roleBaseHref(role: Role) {
  switch (role) {
    case "STUDENT": return "/student";
    case "LECTURER": return "/lecturer";
    case "DEPARTMENT_OFFICER": return "/department";
    case "QA": return "/qa";
    case "ADMIN": return "/admin";
  }
}
