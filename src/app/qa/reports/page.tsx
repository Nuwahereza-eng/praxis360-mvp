import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function Reports() {
  await requireRole("QA");
  const reports = [
    { title: "Assessment Feedback Report", href: "/qa/feedback" },
    { title: "Teaching Evaluation Report", href: "/qa/evaluations" },
    { title: "Student Voice Report", href: "/qa/voice" },
    { title: "Learning Gap Report", href: "/qa/learning" },
    { title: "Institutional Improvement Report", href: "/qa/actions" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Link key={r.title} href={r.href} className="card-p hover:shadow-md transition">
            <div className="font-semibold">{r.title}</div>
            <div className="text-xs text-on-surface-variant mt-1">Open interactive view →</div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant">Downloadable PDF/CSV export is a planned enhancement.</p>
    </div>
  );
}
