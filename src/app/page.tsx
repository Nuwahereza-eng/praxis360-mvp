import Link from "next/link";
import { LoopStrip } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-outline-variant bg-surface-container-lowest/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary grid place-items-center font-bold">P</div>
            <span className="font-semibold text-lg">Praxis360</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="btn-outline">Sign in</Link>
            <Link href="/login" className="btn-primary">Explore Demo</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="badge bg-secondary-container text-on-secondary-container mb-6">
          AI-powered university intelligence platform
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-on-surface leading-tight">Praxis360</h1>
        <p className="text-2xl md:text-3xl font-semibold text-on-surface-variant mt-3">
          From Feedback to Improvement.
        </p>
        <p className="max-w-3xl mx-auto text-lg text-on-surface-variant mt-6">
          An AI-powered university platform that transforms assessment feedback, student voice, and teaching
          evaluation into measurable action and improvement.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login" className="btn-primary text-base px-6 py-3">Explore Demo</Link>
          <a href="#how" className="btn-outline text-base px-6 py-3">See How It Works</a>
        </div>
      </section>

      {/* Pillars */}
      <section id="how" className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Learn Better",
            body:
              "Close assessment feedback loops and address learning gaps before examinations. AI helps students understand feedback and act on it.",
          },
          {
            title: "Be Heard",
            body:
              "Give students one trusted place to raise issues and track institutional action end-to-end — from submission to verification.",
          },
          {
            title: "Improve Continuously",
            body:
              "Turn feedback and learning data into evidence-based institutional improvement, visible in a public 'You Said → We Did' feed.",
          },
        ].map((p) => (
          <div key={p.title} className="card-p">
            <h3 className="text-xl font-semibold text-on-surface">{p.title}</h3>
            <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">{p.body}</p>
          </div>
        ))}
      </section>

      {/* Loops */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-on-surface text-center">Three closed loops</h2>
          <p className="text-center text-on-surface-variant mt-2">
            No feedback should disappear into a form, spreadsheet, or office without a visible path toward action.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="card-p">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Academic Feedback</div>
              <p className="mt-1 font-semibold text-on-surface">Close the learning loop.</p>
              <p className="text-sm text-on-surface-variant mt-1">Every score becomes a step toward verified improvement.</p>
              <div className="mt-4">
                <LoopStrip
                  variant="primary"
                  steps={[
                    { label: "Assess", icon: Icon.Assessments },
                    { label: "Feedback", icon: Icon.Feedback },
                    { label: "Diagnose", icon: Icon.Insights },
                    { label: "Recover", icon: Icon.Recovery },
                    { label: "Verify", icon: Icon.Check },
                    { label: "Improve", icon: Icon.Trend },
                  ]}
                />
              </div>
            </div>
            <div className="card-p">
              <div className="text-xs font-semibold text-secondary uppercase tracking-wide">Student Voice</div>
              <p className="mt-1 font-semibold text-on-surface">Every voice, a visible path.</p>
              <p className="text-sm text-on-surface-variant mt-1">From an anonymous concern to a verified resolution.</p>
              <div className="mt-4">
                <LoopStrip
                  variant="secondary"
                  steps={[
                    { label: "Raise", icon: Icon.RaiseIssue },
                    { label: "Route", icon: Icon.Routing },
                    { label: "Act", icon: Icon.Send },
                    { label: "Update", icon: Icon.Chat },
                    { label: "Verify", icon: Icon.Check },
                    { label: "Improve", icon: Icon.Trend },
                  ]}
                />
              </div>
            </div>
            <div className="card-p">
              <div className="text-xs font-semibold text-tertiary uppercase tracking-wide">Teaching Evaluation</div>
              <p className="mt-1 font-semibold text-on-surface">Turn ratings into action.</p>
              <p className="text-sm text-on-surface-variant mt-1">Anonymous evaluations become institutional response.</p>
              <div className="mt-4">
                <LoopStrip
                  variant="tertiary"
                  steps={[
                    { label: "Evaluate", icon: Icon.Evaluations },
                    { label: "Analyze", icon: Icon.Analytics },
                    { label: "Identify", icon: Icon.Insights },
                    { label: "Act", icon: Icon.Send },
                    { label: "Announce", icon: Icon.YouSaid },
                    { label: "Improve", icon: Icon.Trend },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-on-surface-variant">
          <div>© {new Date().getFullYear()} Praxis360 — Demo Build</div>
          <div>Every voice should lead somewhere. Every feedback should lead to action.</div>
        </div>
      </footer>
    </main>
  );
}
