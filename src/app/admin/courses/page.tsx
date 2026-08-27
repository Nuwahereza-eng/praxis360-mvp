import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCourses() {
  await requireRole("ADMIN");
  const courses = await prisma.course.findMany({ include: { lecturer: true, semester: true, department: true, enrollments: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Courses</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Lecturer</th><th>Semester</th><th>Enrolled</th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.code}</td>
                <td className="font-medium">{c.name}</td>
                <td>{c.department.name}</td>
                <td>{c.lecturer.firstName} {c.lecturer.lastName}</td>
                <td>{c.semester.name} {c.semester.academicYear}</td>
                <td>{c.enrollments.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
