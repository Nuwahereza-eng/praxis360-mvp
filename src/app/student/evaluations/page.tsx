import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, ProgressBar } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default async function StudentEvaluations({
  searchParams,
}: {
  searchParams?: { thanks?: string };
}) {
  const s = await requireRole("STUDENT");
  const semester = await prisma.semester.findFirst({ where: { status: "ACTIVE" } });
  const now = new Date();
  const evalOpen = !!semester && semester.evaluationStartDate <= now && semester.evaluationEndDate >= now;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: s.sub, semesterId: semester?.id },
    include: { course: { include: { lecturer: true } } },
  });
  const totalQuestions = await prisma.evaluationQuestion.count({ where: { type: "RATING" } });

  const perCourse = await Promise.all(
    enrollments.map(async (e) => {
      const answered = await prisma.evaluationResponse.count({
        where: { studentId: s.sub, courseId: e.courseId, question: { type: "RATING" } },
      });
      const totalEnrolled = await prisma.enrollment.count({ where: { courseId: e.courseId } });
      const participants = await prisma.evaluationResponse.findMany({
        where: { courseId: e.courseId }, select: { studentId: true }, distinct: ["studentId"],
      });
      const participationPct = totalEnrolled === 0 ? 0 : (participants.length / totalEnrolled) * 100;
      return { enrollment: e, answered, participationPct, participants: participants.length, totalEnrolled };
    }),
  );

  const doneCourses = perCourse.filter((c) => c.answered >= totalQuestions).length;
  const pendingCourses = perCourse.length - doneCourses;
  const overallPct = perCourse.length === 0 ? 0 : Math.round((doneCourses / perCourse.length) * 100);

  const daysLeft = evalOpen && semester
    ? Math.max(0, Math.ceil((semester.evaluationEndDate.getTime() - now.getTime()) / 86_400_000))
    : 0;

  const showThanks = searchParams?.thanks === "1";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-primary via-primary to-secondary text-on-primary shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">Your Voice Matters</div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">Shape how you&apos;re taught next semester</h1>
            <p className="text-sm opacity-90 mt-2">
              {evalOpen
                ? `Rate ${pendingCourses > 0 ? pendingCourses : "your"} course${pendingCourses === 1 ? "" : "s"} — takes about 3 minutes each. Fully anonymous.`
                : "Teaching evaluations are not currently open. Check back next semester."}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">🔒 Anonymous</span>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">⏱ ~3 minutes each</span>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">📢 Directly influences teaching</span>
              {evalOpen && (
                <span className="inline-flex items-center gap-1 bg-white/25 px-2.5 py-1 rounded-full font-semibold">
                  ⏳ {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                </span>
              )}
            </div>
          </div>

          {perCourse.length > 0 && (
            <div className="flex items-center gap-4">
              <RingProgress pct={overallPct} />
              <div className="text-sm">
                <div className="font-bold text-lg">{doneCourses} / {perCourse.length}</div>
                <div className="opacity-90 text-xs">courses evaluated</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showThanks && (
        <div className="card-p bg-success-container border-success/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-success">🎉 Thanks — your feedback is in!</div>
            <div className="text-sm text-on-surface-variant">
              {pendingCourses > 0
                ? `${pendingCourses} course${pendingCourses === 1 ? "" : "s"} still to go. You're shaping how you're taught next term.`
                : "All done — you evaluated every course. Watch the You Said → We Did board for changes."}
            </div>
          </div>
          <Link href="/student/you-said" className="btn-outline text-sm">See You Said → We Did</Link>
        </div>
      )}

      {/* Transparency: You Said → We Did teaser */}
      <div className="card-p flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary-container/40">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <div className="font-semibold">Last semester students said…</div>
            <div className="text-sm text-on-surface-variant">
              &quot;Feedback took too long.&quot; → Average turnaround dropped from 14 to 6 days. Your ratings drive real changes.
            </div>
          </div>
        </div>
        <Link href="/student/you-said" className="btn-outline text-sm">See what changed</Link>
      </div>

      {!evalOpen && (
        <div className="card-p text-center">
          <div className="text-lg font-semibold">Evaluation window is closed</div>
          <div className="text-sm text-on-surface-variant mt-1">You&apos;ll get a notification the moment it opens.</div>
        </div>
      )}

      {evalOpen && perCourse.length === 0 && (
        <div className="card-p text-center">
          <div className="font-semibold">No enrolled courses this semester.</div>
          <div className="text-sm text-on-surface-variant mt-1">Ask your department if this looks wrong.</div>
        </div>
      )}

      {evalOpen && perCourse.map(({ enrollment, answered, participationPct, participants, totalEnrolled }) => {
        const done = answered >= totalQuestions;
        const behindClass = participationPct >= 40 && !done;
        return (
          <div key={enrollment.id} className={`card-p ${done ? "border-success/30" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-lg">{enrollment.course.name}</div>
                  <Badge className={done ? "bg-success-container text-success" : "bg-warning-container text-warning"}>
                    {done ? "✓ Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className="text-xs text-on-surface-variant mt-1">
                  {enrollment.course.code} • Lecturer identity hidden until the window closes
                </div>
              </div>
              {!done && (
                <Link
                  href={`/student/evaluations/${enrollment.courseId}`}
                  className="btn-primary shrink-0"
                >
                  Start (3 min) →
                </Link>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Class participation</span>
                <span>
                  <span className="font-semibold text-on-surface">{Math.round(participationPct)}%</span>
                  {" "}({participants}/{totalEnrolled}) • target 90%
                </span>
              </div>
              <ProgressBar value={participationPct} />
              {behindClass && (
                <div className="text-xs text-warning mt-2">
                  🔥 Your classmates are already voting — don&apos;t let them speak for you.
                </div>
              )}
              {done && (
                <div className="text-sm text-success font-medium mt-3">
                  Thanks — your response has been recorded anonymously.
                </div>
              )}
            </div>
          </div>
        );
      })}

      {evalOpen && (
        <div className="text-center text-xs text-on-surface-variant">
          Closes {fmtDate(semester?.evaluationEndDate)} • Responses are aggregated — no one can trace a rating back to you.
        </div>
      )}
    </div>
  );
}

function RingProgress({ pct }: { pct: number }) {
  const size = 72;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#ffffff"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="16"
        fontWeight="700"
      >
        {pct}%
      </text>
    </svg>
  );
}
