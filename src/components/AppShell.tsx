import Link from "next/link";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/logout/actions";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

type NavItem = { label: string; href: string; icon?: string };

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student" },
    { label: "My Assessments", href: "/student/assessments" },
    { label: "My Feedback", href: "/student/feedback" },
    { label: "Learning Recovery", href: "/student/recovery" },
    { label: "Raise an Issue", href: "/student/issues/new" },
    { label: "My Issues", href: "/student/issues" },
    { label: "Teaching Evaluations", href: "/student/evaluations" },
    { label: "You Said → We Did", href: "/student/you-said" },
    { label: "Notifications", href: "/student/notifications" },
  ],
  LECTURER: [
    { label: "Dashboard", href: "/lecturer" },
    { label: "Courses", href: "/lecturer/courses" },
    { label: "Assessments", href: "/lecturer/assessments" },
    { label: "Students at Risk", href: "/lecturer/at-risk" },
    { label: "Analytics", href: "/lecturer/analytics" },
    { label: "Teaching Evaluation Results", href: "/lecturer/evaluations" },
    { label: "Notifications", href: "/lecturer/notifications" },
  ],
  DEPARTMENT_OFFICER: [
    { label: "Dashboard", href: "/department" },
    { label: "All Cases", href: "/department/cases" },
    { label: "New", href: "/department/cases?status=SUBMITTED" },
    { label: "Assigned", href: "/department/cases?status=ASSIGNED" },
    { label: "In Progress", href: "/department/cases?status=IN_PROGRESS" },
    { label: "Resolved", href: "/department/cases?status=RESOLVED" },
    { label: "Analytics", href: "/department/analytics" },
  ],
  QA: [
    { label: "Intelligence Dashboard", href: "/qa" },
    { label: "Assessment Feedback", href: "/qa/feedback" },
    { label: "Teaching Evaluation", href: "/qa/evaluations" },
    { label: "Student Voice", href: "/qa/voice" },
    { label: "Learning Analytics", href: "/qa/learning" },
    { label: "Institutional Actions", href: "/qa/actions" },
    { label: "Reports", href: "/qa/reports" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Faculties & Departments", href: "/admin/departments" },
    { label: "Courses", href: "/admin/courses" },
    { label: "Academic Calendar", href: "/admin/calendar" },
    { label: "Evaluation Questions", href: "/admin/questions" },
    { label: "Routing Rules", href: "/admin/routing" },
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

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr] bg-surface">
      <aside className="hidden md:flex flex-col bg-primary text-on-primary">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-on-primary text-primary grid place-items-center font-bold">P</div>
            <div>
              <div className="font-semibold">Praxis360</div>
              <div className="text-[11px] uppercase tracking-wider opacity-70">{ROLE_LABEL[role]}</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="p-3 border-t border-white/10">
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10">
            Sign out
          </button>
        </form>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">{ROLE_LABEL[role]}</div>
              <div className="text-lg font-semibold">Welcome, {userName.split(" ")[0]}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`${roleBaseHref(role)}/notifications`}
                className="relative btn-outline text-sm"
              >
                Notifications
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-error text-on-error rounded-full w-5 h-5 grid place-items-center font-bold">
                    {unread}
                  </span>
                )}
              </Link>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden overflow-x-auto whitespace-nowrap border-t border-outline-variant px-3 py-2 flex gap-2">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs px-3 py-1.5 rounded-full bg-surface-container">
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
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
