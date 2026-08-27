import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LecturerCourses() {
  const s = await requireRole("LECTURER");
  const courses = await prisma.course.findMany({
    where: { lecturerId: s.sub },
    include: { enrollments: true, assessments: true, semester: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Courses</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="card-p">
            <div className="text-xs text-on-surface-variant">{c.code} • {c.semester.name} {c.semester.academicYear}</div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm mt-2">{c.enrollments.length} enrolled • {c.assessments.length} assessments</div>
            <Link href={`/lecturer/assessments`} className="link text-sm mt-2 inline-block">Manage assessments →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
