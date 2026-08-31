import Link from "next/link";
import Image from "next/image";
import { LoopStrip } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      {/* Header — floats over hero */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-9 h-9 rounded-lg bg-white text-primary grid place-items-center font-bold shadow-lg">P</div>
            <span className="font-semibold text-lg drop-shadow">Praxis360</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-white/95 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-white text-primary hover:bg-white/95 text-sm font-semibold px-4 py-2 rounded-lg shadow-md transition inline-flex items-center gap-1.5"
            >
              Explore Demo
              <Icon.ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero with photo background */}
      <section className="relative isolate overflow-hidden">
        {/* Photo layer */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero-students.jpg"
            alt="Students collaborating on campus"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Gradient overlays for legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-secondary/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 text-white">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 backdrop-blur bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Icon.Ai className="w-3.5 h-3.5" />
              AI-powered university intelligence platform
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mt-6 drop-shadow-sm">
              From feedback<br />to <span className="text-tertiary-container">improvement.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mt-6 max-w-2xl leading-relaxed">
              Praxis360 turns assessment feedback, student voice and teaching evaluation into
              <span className="font-semibold text-white"> measurable action</span> — visible to
              students, lecturers, departments and quality assurance.
            </p>
            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <Link
                href="/login"
                className="bg-white text-primary hover:bg-white/95 text-base font-semibold px-6 py-3 rounded-xl shadow-lg transition inline-flex items-center gap-2"
              >
                <Icon.Ai className="w-4 h-4" />
                Explore Demo
              </Link>
              <a
                href="#how"
                className="backdrop-blur bg-white/10 hover:bg-white/20 border border-white/30 text-white text-base font-medium px-6 py-3 rounded-xl transition inline-flex items-center gap-2"
              >
                See How It Works
                <Icon.ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust chips */}
            <div className="mt-10 flex flex-wrap items-center gap-2">
              {[
                { icon: Icon.Shield, label: "Anonymous by default" },
                { icon: Icon.Clock, label: "SLA-tracked" },
                { icon: Icon.YouSaid, label: "Closed-loop" },
                { icon: Icon.Ai, label: "AI-assisted" },
              ].map((c) => {
                const IconEl = c.icon;
                return (
                  <div
                    key={c.label}
                    className="inline-flex items-center gap-1.5 text-xs font-medium backdrop-blur bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-full"
                  >
                    <IconEl className="w-3.5 h-3.5" />
                    {c.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats strip floating over bottom of hero */}
        <div className="relative max-w-6xl mx-auto px-6 -mb-10 md:-mb-14 z-10">
          <div className="rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant grid grid-cols-2 md:grid-cols-4 divide-x divide-outline-variant overflow-hidden">
            {[
              { icon: Icon.Community, value: "1 place", label: "for every student voice" },
              { icon: Icon.YouSaid, value: "6 steps", label: "from feedback to verified action" },
              { icon: Icon.Ai, value: "AI insights", label: "on spikes, sentiment & risk" },
              { icon: Icon.Trend, value: "Transparent", label: "You Said, We Did feed" },
            ].map((s) => {
              const IconEl = s.icon;
              return (
                <div key={s.label} className="p-5">
                  <div className="w-9 h-9 rounded-lg bg-primary-container text-primary grid place-items-center mb-2">
                    <IconEl className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="text-lg font-bold text-on-surface">{s.value}</div>
                  <div className="text-xs text-on-surface-variant">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="how" className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">The promise</div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mt-2">
            Every voice should lead somewhere.
          </h2>
          <p className="text-on-surface-variant mt-3">
            Feedback that disappears into a form kills trust. Praxis360 makes the entire journey
            from concern to improvement <em>visible</em>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Icon.Recovery,
              title: "Learn Better",
              body:
                "Close assessment feedback loops and address learning gaps before examinations. AI helps students understand feedback and act on it.",
              tone: "bg-primary-container text-primary",
            },
            {
              icon: Icon.RaiseIssue,
              title: "Be Heard",
              body:
                "Give students one trusted place to raise issues and track institutional action end-to-end — from submission to verification.",
              tone: "bg-secondary-container text-secondary",
            },
            {
              icon: Icon.Trend,
              title: "Improve Continuously",
              body:
                "Turn feedback and learning data into evidence-based institutional improvement, visible in a public “You Said, We Did” feed.",
              tone: "bg-tertiary-container text-tertiary",
            },
          ].map((p) => {
            const IconEl = p.icon;
            return (
              <div key={p.title} className="card-p hover:shadow-lg transition">
                <div className={`w-11 h-11 rounded-xl grid place-items-center ${p.tone}`}>
                  <IconEl className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <h3 className="text-xl font-semibold text-on-surface mt-4">{p.title}</h3>
                <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Loops */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider">Architecture</div>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mt-2">Three closed loops</h2>
            <p className="text-on-surface-variant mt-3">
              No feedback should disappear into a form, spreadsheet or office without a visible path
              toward action.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-p">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Academic Feedback</div>
              <p className="mt-1 font-semibold text-on-surface">Close the learning loop.</p>
              <p className="text-sm text-on-surface-variant mt-1">
                Every score becomes a step toward verified improvement.
              </p>
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
              <p className="text-sm text-on-surface-variant mt-1">
                From an anonymous concern to a verified resolution.
              </p>
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
              <p className="text-sm text-on-surface-variant mt-1">
                Anonymous evaluations become institutional response.
              </p>
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

      {/* CTA band */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary text-on-primary p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Ready to explore</div>
              <h3 className="text-3xl md:text-4xl font-bold mt-2">See Praxis360 in action.</h3>
              <p className="opacity-90 mt-2 max-w-xl">
                Sign in with any of the seeded demo roles — Student, Lecturer, Department Officer, QA
                or Administrator — and walk through the entire closed loop.
              </p>
            </div>
            <Link
              href="/login"
              className="bg-white text-primary hover:bg-white/95 text-base font-semibold px-6 py-3 rounded-xl shadow-lg inline-flex items-center gap-2"
            >
              Launch demo
              <Icon.ArrowRight className="w-4 h-4" />
            </Link>
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
