// Praxis360 AI service abstraction.
// Provides deterministic fallbacks so demos never break when no AI key is set.

import { ISSUE_CATEGORIES, ROUTING_MAP } from "./enums";

type FeedbackAnalysis = {
  clarityScore: number;
  actionabilityScore: number;
  applicabilityScore: number;
  overallScore: number;
  issues: string[];
  suggestion: string;
};

type FeedbackExplanation = {
  meaning: string;
  whyItMatters: string;
  whatToImprove: string;
  nextSteps: string[];
};

type IssueClassification = {
  category: string;
  issueType: string;
  location: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  responsibleDepartmentCode: string;
  keywords: string[];
  confidence: number;
};

function has(text: string, ...words: string[]) {
  const l = text.toLowerCase();
  return words.some((w) => l.includes(w));
}

export const AIService = {
  analyzeFeedback(feedback: string): FeedbackAnalysis {
    const len = feedback.trim().length;
    const hasAction = /(should|try|improve|next|revise|rewrite|include|add|explain)/i.test(feedback);
    const hasSpecific = /(chapter|section|criterion|outcome|part|example|reference|source)/i.test(
      feedback,
    );
    const clarity = Math.min(100, 55 + Math.floor(len / 10));
    const actionability = hasAction ? 78 : 45;
    const applicability = hasSpecific ? 85 : 60;
    const overall = Math.round((clarity + actionability + applicability) / 3);
    const issues: string[] = [];
    if (!hasAction) issues.push("The feedback does not tell the student what to do next.");
    if (!hasSpecific) issues.push("Feedback could reference the specific rubric criterion or learning outcome.");
    if (len < 40) issues.push("Feedback is very brief and may lack detail.");
    return {
      clarityScore: clarity,
      actionabilityScore: actionability,
      applicabilityScore: applicability,
      overallScore: overall,
      issues,
      suggestion:
        issues.length === 0
          ? "Feedback looks clear, specific, and actionable."
          : "Explain specifically what the student should improve and how to apply it.",
    };
  },

  explainFeedback(feedback: string, criterion?: string): FeedbackExplanation {
    const focus = criterion || "your work";
    return {
      meaning: `Your lecturer is telling you that ${focus.toLowerCase()} needs stronger reasoning and clearer structure. In plain terms: "${feedback.trim()}" means the argument or evidence you provided did not fully convince the marker.`,
      whyItMatters: `Analysis and structure are core academic skills. Strengthening them lifts your marks across every assessment, not just this one.`,
      whatToImprove: `Focus on ${focus.toLowerCase()}: state a clear position, support it with at least two credible sources, and explain how the evidence connects to your point.`,
      nextSteps: [
        "Re-read the rubric criterion carefully.",
        "Rewrite one paragraph using the point-evidence-explanation pattern.",
        "Complete the recommended correction activity.",
        "Ask your lecturer if anything is still unclear.",
      ],
    };
  },

  classifyIssue(title: string, description: string): IssueClassification {
    const text = `${title} ${description}`.toLowerCase();
    let category = "Other";
    let issueType = "General";
    let priority: IssueClassification["priority"] = "MEDIUM";
    let location: string | null = null;

    if (has(text, "wifi", "wi-fi", "internet", "network", "email", "portal", "elearning", "e-learning"))
      { category = "ICT"; issueType = "Connectivity"; }
    else if (has(text, "library", "book", "catalogue")) { category = "Library"; issueType = "Access"; }
    else if (has(text, "fee", "payment", "invoice", "refund", "bursary", "finance")) { category = "Finance"; issueType = "Payment"; }
    else if (has(text, "registration", "enroll", "enrol", "add course", "drop course", "registrar")) { category = "Registration"; issueType = "Registration"; }
    else if (has(text, "toilet", "water", "electric", "power", "generator", "lecture room", "classroom", "facility", "facilities", "leak")) { category = "Facilities"; issueType = "Maintenance"; }
    else if (has(text, "hostel", "accommodation", "dorm", "room")) { category = "Accommodation"; issueType = "Housing"; }
    else if (has(text, "security", "theft", "unsafe", "harass")) { category = "Security"; issueType = "Safety"; priority = "HIGH"; }
    else if (has(text, "grade", "mark", "feedback", "assessment", "exam", "coursework")) { category = "Assessment"; issueType = "Assessment"; }
    else if (has(text, "lecturer", "teaching", "lecture", "course")) { category = "Academic"; issueType = "Teaching"; }
    else if (has(text, "welfare", "counsel", "mental", "stress")) { category = "Student Welfare"; issueType = "Welfare"; }

    if (has(text, "library")) location = "Library";
    else if (has(text, "hostel")) location = "Hostels";
    else if (has(text, "lecture room", "classroom", "block")) location = "Academic Block";
    else if (has(text, "cafeteria", "canteen")) location = "Cafeteria";

    if (has(text, "urgent", "immediately", "emergency", "danger", "unsafe")) priority = "HIGH";
    if (has(text, "weeks", "months", "days") && (priority as string) === "LOW") priority = "MEDIUM";

    const keywords = Array.from(new Set(
      text
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["this", "that", "with", "have", "been", "your", "from", "they", "please"].includes(w))
        .slice(0, 6),
    ));

    return {
      category,
      issueType,
      location,
      priority,
      responsibleDepartmentCode: ROUTING_MAP[category] || "QA",
      keywords,
      confidence: category === "Other" ? 0.45 : 0.87,
    };
  },

  extractEvaluationThemes(comments: string[]): { theme: string; count: number; sentiment: string }[] {
    const themes: Record<string, number> = {};
    for (const c of comments) {
      const t = c.toLowerCase();
      if (/(clear|explain|understand|clarity)/.test(t)) themes["Teaching clarity"] = (themes["Teaching clarity"] || 0) + 1;
      if (/(feedback|comment|marking)/.test(t)) themes["Feedback timeliness"] = (themes["Feedback timeliness"] || 0) + 1;
      if (/(assessment|exam|coursework|test)/.test(t)) themes["Assessment quality"] = (themes["Assessment quality"] || 0) + 1;
      if (/(available|contact|reach)/.test(t)) themes["Lecturer availability"] = (themes["Lecturer availability"] || 0) + 1;
      if (/(practical|real|industry|apply)/.test(t)) themes["Practical relevance"] = (themes["Practical relevance"] || 0) + 1;
      if (/(organiz|organis|schedule|plan)/.test(t)) themes["Course organization"] = (themes["Course organization"] || 0) + 1;
    }
    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count, sentiment: count > 2 ? "recurring" : "emerging" }));
  },

  generateQAInsights(stats: {
    onTimeFeedbackPct: number;
    responseRatePct: number;
    openIssues: number;
    recoveredGaps: number;
    resolvedIssues: number;
  }) {
    const insights: { severity: "critical" | "high" | "medium" | "low"; text: string; action: string }[] = [];
    if (stats.onTimeFeedbackPct < 70)
      insights.push({
        severity: "high",
        text: `Only ${stats.onTimeFeedbackPct}% of assessment feedback met the institutional turnaround target.`,
        action: "Introduce a 7-day feedback standard and monitor per-course compliance.",
      });
    if (stats.responseRatePct < 60)
      insights.push({
        severity: "medium",
        text: `Teaching evaluation response rate is ${stats.responseRatePct}%, below the 70% target.`,
        action: "Send targeted reminders to low-participation courses before evaluation closes.",
      });
    if (stats.openIssues > 5)
      insights.push({
        severity: "medium",
        text: `${stats.openIssues} student issues are open across departments.`,
        action: "Review departmental backlogs during the next QA cycle meeting.",
      });
    insights.push({
      severity: "low",
      text: `${stats.recoveredGaps} learning gaps have been recovered through corrective activities.`,
      action: "Publish success stories via You Said → We Did.",
    });
    return insights;
  },
};

export const AI_CATEGORIES = ISSUE_CATEGORIES;
