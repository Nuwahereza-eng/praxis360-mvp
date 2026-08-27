"use client";

import { useMemo, useState, useTransition } from "react";
import { saveMarkingAction, analyzeFeedbackAction } from "./actions";

type Criterion = { id: string; title: string; maxMarks: number; outcomeTitle: string; score: number; feedback: string };

export function MarkingWorkspace({
  assessmentId,
  studentId,
  totalMarks,
  rubric,
  initialFeedback,
  initialStatus,
}: {
  assessmentId: string;
  studentId: string;
  totalMarks: number;
  rubric: Criterion[];
  initialFeedback: string;
  initialStatus: string;
}) {
  const [items, setItems] = useState(rubric);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [status, setStatus] = useState(initialStatus);
  const [aiPending, startAI] = useTransition();
  const [analysis, setAnalysis] = useState<{ clarityScore: number; actionabilityScore: number; applicabilityScore: number; overallScore: number; issues: string[]; suggestion: string } | null>(null);

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.score || 0), 0), [items]);
  const percentage = totalMarks > 0 ? (total / totalMarks) * 100 : 0;

  async function runAI() {
    if (!feedback.trim()) return;
    startAI(async () => {
      const a = await analyzeFeedbackAction(feedback);
      setAnalysis(a);
    });
  }

  async function save(action: "DRAFT" | "PUBLISH") {
    const fd = new FormData();
    fd.set("assessmentId", assessmentId);
    fd.set("studentId", studentId);
    fd.set("totalScore", String(total));
    fd.set("percentage", String(percentage));
    fd.set("feedback", feedback);
    fd.set("action", action);
    fd.set("criteria", JSON.stringify(items.map((i) => ({ id: i.id, score: Number(i.score), feedback: i.feedback }))));
    await saveMarkingAction(fd);
    setStatus(action === "PUBLISH" ? "RELEASED" : "MARKED");
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr_1fr] gap-4">
      {/* Left: student submission (placeholder) */}
      <div className="card-p">
        <div className="section-title mb-2">Student Submission</div>
        <div className="text-sm text-on-surface-variant mb-2">Demo mode — submission is not attached.</div>
        <div className="border border-dashed border-outline-variant rounded-lg p-4 text-sm bg-surface-container-low min-h-[300px]">
          <p><b>Requirements Overview.</b> This submission presents an initial set of requirements gathered from a small case study. It identifies stakeholders and lists functional needs, but does not always link each requirement to a stakeholder rationale.</p>
        </div>
      </div>

      {/* Middle: rubric + marks */}
      <div className="card-p">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Rubric</div>
          <div className="text-sm font-bold">{total.toFixed(0)} / {totalMarks} ({percentage.toFixed(0)}%)</div>
        </div>
        <div className="space-y-3">
          {items.map((c, idx) => (
            <div key={c.id} className="border border-outline-variant rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{c.title}</div>
                  <div className="text-xs text-on-surface-variant">Outcome: {c.outcomeTitle}</div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="number"
                    min={0}
                    max={c.maxMarks}
                    value={c.score}
                    onChange={(e) => {
                      const copy = [...items];
                      copy[idx] = { ...c, score: Math.max(0, Math.min(c.maxMarks, Number(e.target.value))) };
                      setItems(copy);
                    }}
                    className="input w-20 text-right"
                  />
                  <span className="text-on-surface-variant">/ {c.maxMarks}</span>
                </div>
              </div>
              <textarea
                className="input mt-2 min-h-[60px] text-sm"
                placeholder="Notes on this criterion…"
                value={c.feedback}
                onChange={(e) => {
                  const copy = [...items];
                  copy[idx] = { ...c, feedback: e.target.value };
                  setItems(copy);
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="label">Overall feedback to student</label>
          <textarea className="input min-h-[120px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button type="button" onClick={() => save("DRAFT")} className="btn-outline">Save Draft</button>
          <button type="button" onClick={() => save("PUBLISH")} className="btn-primary">Publish Feedback</button>
          <button type="button" onClick={runAI} className="btn-secondary" disabled={aiPending || !feedback.trim()}>
            {aiPending ? "Analysing…" : "AI Review"}
          </button>
          <div className="text-xs text-on-surface-variant self-center">Status: {status}</div>
        </div>
      </div>

      {/* Right: AI feedback quality */}
      <div className="card-p bg-info-container/30 border-info/30">
        <div className="flex items-center justify-between">
          <div className="section-title">Feedback Quality (TUAA)</div>
          <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">AI-generated — review required</span>
        </div>
        {!analysis ? (
          <p className="text-sm mt-2 text-on-surface-variant">Click <b>AI Review</b> to score clarity, actionability, and applicability of your feedback.</p>
        ) : (
          <div className="mt-3 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="card p-2 text-center"><div className="kpi-label">Clarity</div><div className="kpi-value text-xl">{analysis.clarityScore}</div></div>
              <div className="card p-2 text-center"><div className="kpi-label">Actionable</div><div className="kpi-value text-xl">{analysis.actionabilityScore}</div></div>
              <div className="card p-2 text-center"><div className="kpi-label">Applicable</div><div className="kpi-value text-xl">{analysis.applicabilityScore}</div></div>
              <div className="card p-2 text-center"><div className="kpi-label">Overall</div><div className="kpi-value text-xl">{analysis.overallScore}</div></div>
            </div>
            {analysis.issues.length > 0 && (
              <div>
                <div className="font-semibold">Issues detected</div>
                <ul className="list-disc pl-5">
                  {analysis.issues.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            )}
            <div>
              <div className="font-semibold">Suggestion</div>
              <p>{analysis.suggestion}</p>
            </div>
            <div className="text-xs text-on-surface-variant">You may Accept, Edit, or Dismiss AI suggestions. Your feedback is never replaced automatically.</div>
          </div>
        )}
      </div>
    </div>
  );
}
