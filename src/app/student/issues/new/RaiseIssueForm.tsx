"use client";

import { useState, useTransition } from "react";
import { ISSUE_CATEGORIES, PrivacyMode } from "@/lib/enums";
import { classifyPreviewAction, submitIssueAction } from "./actions";

type Classification = {
  category: string;
  issueType: string;
  location: string | null;
  priority: string;
  responsibleDepartmentCode: string;
  keywords: string[];
  confidence: number;
};

export function RaiseIssueForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [privacy, setPrivacy] = useState<string>(PrivacyMode.IDENTIFIED);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function preview() {
    if (!title.trim() || !description.trim()) return;
    startTransition(async () => {
      const c = await classifyPreviewAction(title, description);
      setClassification(c);
      if (!category) setCategory(c.category);
      if (!location && c.location) setLocation(c.location);
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card-p space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary" required />
        </div>
        <div>
          <label className="label">Describe the issue</label>
          <textarea className="input min-h-[160px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain what happened, when, and how it affects you" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Let AI decide</option>
              {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location (optional)</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Library" />
          </div>
        </div>
        <div>
          <label className="label">Privacy</label>
          <div className="flex flex-wrap gap-3 text-sm">
            {[
              { v: PrivacyMode.IDENTIFIED, l: "Identified" },
              { v: PrivacyMode.CONFIDENTIAL, l: "Confidential" },
              { v: PrivacyMode.ANONYMOUS, l: "Anonymous" },
            ].map((p) => (
              <label key={p.v} className="flex items-center gap-2 border border-outline-variant rounded-lg px-3 py-2 cursor-pointer">
                <input type="radio" name="privacy" checked={privacy === p.v} onChange={() => setPrivacy(p.v)} />
                {p.l}
              </label>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Confidential issues hide your identity from public views. Anonymous issues do not link to your profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={preview} className="btn-outline" disabled={pending || !title || !description}>
            {pending ? "Analysing…" : "AI: classify my issue"}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={submitting || !title || !description}
            onClick={async () => {
              setSubmitting(true);
              const fd = new FormData();
              fd.set("title", title);
              fd.set("description", description);
              fd.set("category", category || classification?.category || "Other");
              fd.set("location", location);
              fd.set("privacy", privacy);
              if (classification) {
                fd.set("issueType", classification.issueType);
                fd.set("priority", classification.priority);
                fd.set("responsibleDepartmentCode", classification.responsibleDepartmentCode);
                fd.set("confidence", String(classification.confidence));
              }
              await submitIssueAction(fd);
            }}
          >
            {submitting ? "Submitting…" : "Submit issue"}
          </button>
        </div>
      </div>

      <div className="card-p bg-info-container/40 border-info/30">
        <div className="flex items-center justify-between">
          <div className="section-title">AI Classification Preview</div>
          <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">AI-generated — review required</span>
        </div>
        {!classification ? (
          <p className="text-sm text-on-surface-variant mt-2">
            Add a title and description, then click <b>AI: classify my issue</b> to see how Praxis360 will route it.
            You can always correct the category before submitting.
          </p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-on-surface-variant">Category</dt><dd className="font-semibold">{classification.category}</dd>
            <dt className="text-on-surface-variant">Issue Type</dt><dd>{classification.issueType}</dd>
            <dt className="text-on-surface-variant">Location</dt><dd>{classification.location || "—"}</dd>
            <dt className="text-on-surface-variant">Priority</dt><dd>{classification.priority}</dd>
            <dt className="text-on-surface-variant">Route to</dt><dd className="font-semibold">{classification.responsibleDepartmentCode}</dd>
            <dt className="text-on-surface-variant">Confidence</dt><dd>{Math.round(classification.confidence * 100)}%</dd>
            <dt className="text-on-surface-variant col-span-2 mt-2">Keywords</dt>
            <dd className="col-span-2 flex flex-wrap gap-1">
              {classification.keywords.map((k) => (
                <span key={k} className="badge bg-surface-container text-on-surface-variant">{k}</span>
              ))}
            </dd>
          </dl>
        )}
      </div>
    </div>
  );
}
