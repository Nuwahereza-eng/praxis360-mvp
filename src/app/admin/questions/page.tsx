import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminQuestions() {
  await requireRole("ADMIN");
  const questions = await prisma.evaluationQuestion.findMany({ orderBy: { orderIdx: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Evaluation Questions</h1>
      <ol className="card divide-y divide-outline-variant">
        {questions.map((q) => (
          <li key={q.id} className="px-4 py-3 flex items-center justify-between">
            <span>{q.orderIdx + 1}. {q.text}</span>
            <span className="text-xs text-on-surface-variant">{q.type}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
