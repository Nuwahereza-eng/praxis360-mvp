"use client";

import { useState, useTransition, useRef } from "react";
import { ISSUE_CATEGORIES, PrivacyMode } from "@/lib/enums";
import { Icon } from "@/components/icons";
import {
  classifyPreviewAction,
  submitIssueAction,
  findSimilarIssuesAction,
  upvoteIssueAction,
} from "./actions";

type Classification = {
  category: string;
  issueType: string;
  location: string | null;
  priority: string;
  responsibleDepartmentCode: string;
  keywords: string[];
  confidence: number;
};

type SimilarIssue = {
  id: string;
  title: string;
  category: string;
  departmentName: string;
  createdAt: Date | string;
  status: string;
  priority: string;
  upvotes: number;
  matchPct: number;
};

const MAX_FILES = 5;
const MAX_BYTES = 2 * 1024 * 1024;

export function RaiseIssueForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [privacy, setPrivacy] = useState<string>(PrivacyMode.IDENTIFIED);
  const [isPublic, setIsPublic] = useState(true);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [similar, setSimilar] = useState<SimilarIssue[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [checking, startCheck] = useTransition();
  const [upvoting, startUpvote] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function preview() {
    if (!title.trim() || !description.trim()) return;
    startTransition(async () => {
      const c = await classifyPreviewAction(title, description);
      setClassification(c);
      if (!category) setCategory(c.category);
      if (!location && c.location) setLocation(c.location);
    });
  }

  async function checkSimilar() {
    if (!title.trim() || title.trim().length < 6) return;
    startCheck(async () => {
      const results = await findSimilarIssuesAction(title, description, category || undefined);
      setSimilar(results as SimilarIssue[]);
    });
  }

  async function handleUpvote(issueId: string) {
    startUpvote(async () => {
      const fd = new FormData();
      fd.set("issueId", issueId);
      await upvoteIssueAction(fd);
      setSimilar((prev) =>
        prev.map((s) => (s.id === issueId ? { ...s, upvotes: s.upvotes + 1 } : s)),
      );
    });
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const list = Array.from(e.target.files || []);
    if (list.length > MAX_FILES) {
      setFileError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    for (const f of list) {
      if (f.size > MAX_BYTES) {
        setFileError(`"${f.name}" exceeds 2 MB.`);
        return;
      }
    }
    setFiles(list);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form
        className="card-p space-y-4"
        encType="multipart/form-data"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          const fd = new FormData();
          fd.set("title", title);
          fd.set("description", description);
          fd.set("category", category || classification?.category || "Other");
          fd.set("location", location);
          fd.set("privacy", privacy);
          if (isPublic) fd.set("isPublic", "on");
          if (classification) {
            fd.set("issueType", classification.issueType);
            fd.set("priority", classification.priority);
            fd.set("responsibleDepartmentCode", classification.responsibleDepartmentCode);
            fd.set("confidence", String(classification.confidence));
          }
          for (const f of files) fd.append("attachments", f);
          await submitIssueAction(fd);
        }}
      >
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={checkSimilar}
            placeholder="Brief summary"
            required
          />
        </div>
        <div>
          <label className="label">Describe the issue</label>
          <textarea
            className="input min-h-[140px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={checkSimilar}
            placeholder="Explain what happened, when, and how it affects you"
            required
          />
        </div>

        {/* Duplicate detection banner */}
        {(similar.length > 0 || checking) && (
          <div className="border border-warning/40 bg-warning-container/60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold inline-flex items-center gap-2">
                {checking ? (
                  <>
                    <Icon.Search className="w-4 h-4" strokeWidth={2} />
                    Checking for similar issues…
                  </>
                ) : (
                  <>
                    <Icon.AtRisk className="w-4 h-4 text-warning" strokeWidth={2} />
                    {similar.length} similar issue{similar.length === 1 ? "" : "s"} already raised
                  </>
                )}
              </div>
              {!checking && (
                <button
                  type="button"
                  onClick={() => setSimilar([])}
                  className="text-xs text-on-surface-variant hover:underline"
                >
                  Dismiss
                </button>
              )}
            </div>
            {!checking && (
              <p className="text-xs text-on-surface-variant mt-1">
                Upvoting an existing thread carries more weight than duplicate filings.
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {similar.map((si) => (
                <li key={si.id} className="border border-outline-variant rounded-md p-2 bg-surface-container-lowest">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`/student/issues/board#${si.id}`}
                      className="font-medium text-sm hover:underline min-w-0 truncate"
                    >
                      {si.title}
                    </a>
                    <span className="text-[10px] text-on-surface-variant">{si.matchPct}% match</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {si.category} • {si.departmentName} • {si.status}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant inline-flex items-center gap-1">
                      <Icon.ArrowUp className="w-3 h-3" strokeWidth={2} />
                      {si.upvotes} upvotes
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpvote(si.id)}
                      disabled={upvoting}
                      className="btn-outline text-xs py-1 inline-flex items-center gap-1"
                    >
                      <Icon.ArrowUp className="w-3 h-3" strokeWidth={2} />
                      Upvote instead
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

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

        {/* Attachments */}
        <div>
          <label className="label">Attachments (photos or PDF, up to {MAX_FILES}, 2 MB each)</label>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={onFilesChange}
            className="text-sm"
          />
          {fileError && <div className="text-xs text-error mt-1">{fileError}</div>}
          {files.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1 text-xs">
              {files.map((f) => (
                <li key={f.name} className="badge bg-surface-container text-on-surface-variant inline-flex items-center gap-1">
                  <Icon.Paperclip className="w-3 h-3" strokeWidth={2} />
                  {f.name} · {(f.size / 1024).toFixed(0)} KB
                </li>
              ))}
            </ul>
          )}
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

        {/* Public board */}
        <label className="flex items-start gap-2 border border-primary/30 bg-primary-container/30 rounded-lg p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-semibold">Post to the community board (anonymized)</span>
            <span className="block text-xs text-on-surface-variant">
              Classmates can see the issue and upvote it. Your name and personal details are never shown.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={preview} className="btn-outline inline-flex items-center gap-1.5" disabled={pending || !title || !description}>
            <Icon.Ai className="w-4 h-4" strokeWidth={2} />
            {pending ? "Analysing…" : "AI: classify my issue"}
          </button>
          <button type="submit" className="btn-primary inline-flex items-center gap-1.5" disabled={submitting || !title || !description}>
            <Icon.Send className="w-4 h-4" strokeWidth={2} />
            {submitting ? "Submitting…" : "Submit issue"}
          </button>
        </div>
      </form>

      <div className="card-p bg-info-container/40 border-info/30">
        <div className="flex items-center justify-between">
          <div className="section-title inline-flex items-center gap-2">
            <Icon.Ai className="w-4 h-4 text-info" strokeWidth={2} />
            AI Classification Preview
          </div>
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
