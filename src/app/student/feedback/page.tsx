import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtDate } from "@/lib/utils";

export default async function FeedbackList() {
  const s = await requireRole("STUDENT");
  const results = await prisma.assessmentResult.findMany({
    where: { studentId: s.sub, status: "RELEASED" },
    include: { assessment: { include: { course: true } } },
    orderBy: { feedbackReleasedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Feedback</h1>
      {results.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No released feedback yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((r) => (
            <Link key={r.id} href={`/student/feedback/${r.id}`} className="card-p hover:shadow-md transition">
              <div className="text-xs text-on-surface-variant">{r.assessment.course.name}</div>
              <div className="font-semibold">{r.assessment.title}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xl font-bold">{r.percentage.toFixed(0)}%</span>
                <span className="text-xs text-on-surface-variant">Released {fmtDate(r.feedbackReleasedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
