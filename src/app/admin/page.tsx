import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KPI } from "@/components/ui";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const [users, faculties, departments, courses, semesters, questions, issues, actions] = await Promise.all([
    prisma.user.count(),
    prisma.faculty.count(),
    prisma.department.count(),
    prisma.course.count(),
    prisma.semester.count(),
    prisma.evaluationQuestion.count(),
    prisma.issue.count(),
    prisma.institutionalAction.count(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Administration</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Users" value={users} />
        <KPI label="Faculties" value={faculties} />
        <KPI label="Departments" value={departments} />
        <KPI label="Courses" value={courses} />
        <KPI label="Semesters" value={semesters} />
        <KPI label="Evaluation Questions" value={questions} />
        <KPI label="Issues" value={issues} />
        <KPI label="Institutional Actions" value={actions} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          ["Users", "/admin/users"],
          ["Faculties & Departments", "/admin/departments"],
          ["Courses", "/admin/courses"],
          ["Academic Calendar", "/admin/calendar"],
          ["Evaluation Questions", "/admin/questions"],
          ["Routing Rules", "/admin/routing"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="card-p hover:shadow-md">
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-on-surface-variant">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
