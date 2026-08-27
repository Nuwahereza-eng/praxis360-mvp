import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai";
import { fmtDate } from "@/lib/utils";

export default async function LecturerEvaluationResults() {
  const s = await requireRole("LECTURER");
  const semester = await prisma.semester.findFirst({ where: { status: "ACTIVE" } });
  const now = new Date();
  const evaluationClosed = !!semester && semester.evaluationEndDate < now;

  const courses = await prisma.course.findMany({ where: { lecturerId: s.sub } });

  if (!evaluationClosed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Teaching Evaluation Results</h1>
        <div className="card-p">
          Aggregated results become available after the evaluation window closes ({fmtDate(semester?.evaluationEndDate)}).
          Individual responses remain anonymous.
        </div>
      </div>
    );
  }

  const data = await Promise.all(
    courses.map(async (c) => {
      const responses = await prisma.evaluationResponse.findMany({
        where: { courseId: c.id }, include: { question: true },
      });
      const questions = Array.from(new Set(responses.map((r) => r.questionId)));
      const perQuestion = questions.map((qid) => {
        const list = responses.filter((r) => r.questionId === qid);
        const q = list[0].question;
        if (q.type === "RATING") {
          const avg = list.reduce((s, r) => s + (r.rating || 0), 0) / (list.length || 1);
          return { question: q.text, type: "RATING" as const, avg, n: list.length };
        } else {
          return { question: q.text, type: "TEXT" as const, comments: list.map((r) => r.text).filter(Boolean) as string[] };
        }
      });
      const comments = perQuestion.filter((p) => p.type === "TEXT").flatMap((p) => (p as any).comments as string[]);
      const themes = AIService.extractEvaluationThemes(comments);
      return { course: c, perQuestion, themes, participants: new Set(responses.map((r) => r.studentId)).size };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teaching Evaluation Results</h1>
      {data.map((d) => (
        <div key={d.course.id} className="card-p">
          <div className="font-semibold text-lg">{d.course.name}</div>
          <div className="text-xs text-on-surface-variant mb-3">{d.participants} anonymous respondents</div>
          <table className="table">
            <thead><tr><th>Question</th><th>Average</th><th>N</th></tr></thead>
            <tbody>
              {d.perQuestion.filter((p) => p.type === "RATING").map((p, idx) => (
                <tr key={idx}><td>{p.question}</td><td>{(p as any).avg.toFixed(1)}/5</td><td>{(p as any).n}</td></tr>
              ))}
            </tbody>
          </table>
          {d.themes.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-on-surface-variant font-semibold">Themes from comments</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {d.themes.map((t) => (
                  <span key={t.theme} className="badge bg-surface-container text-on-surface-variant">{t.theme} ({t.count})</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
