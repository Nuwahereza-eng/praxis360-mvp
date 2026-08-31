import Link from "next/link";
import { loginAction, quickLoginAction } from "./actions";
import { Icon, type LucideIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const ROLE_TILES: {
  role: string;
  title: string;
  email: string;
  blurb: string;
  accent: string;
  icon: LucideIcon;
}[] = [
  {
    role: "STUDENT",
    title: "Student",
    email: "student@umi.ac.ug",
    blurb: "See feedback, learning gaps, raise issues, complete evaluations.",
    accent: "from-primary to-primary-container",
    icon: Icon.Learning,
  },
  {
    role: "LECTURER",
    title: "Lecturer",
    email: "lecturer@umi.ac.ug",
    blurb: "Mark work with AI feedback quality, spot students at risk.",
    accent: "from-secondary to-tertiary-container",
    icon: Icon.MarkAssessment,
  },
  {
    role: "DEPARTMENT_OFFICER",
    title: "Department Officer",
    email: "ict@umi.ac.ug",
    blurb: "Receive routed issues, resolve cases, communicate with students.",
    accent: "from-tertiary to-primary",
    icon: Icon.Cases,
  },
  {
    role: "QA",
    title: "Quality Assurance",
    email: "qa@umi.ac.ug",
    blurb: "Institution-wide intelligence, publish You Said, We Did.",
    accent: "from-primary-container to-secondary",
    icon: Icon.Insights,
  },
  {
    role: "ADMIN",
    title: "Administrator",
    email: "admin@umi.ac.ug",
    blurb: "Users, faculties, departments, courses, evaluations.",
    accent: "from-tertiary-container to-primary",
    icon: Icon.Shield,
  },
];

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary grid place-items-center font-bold">P</div>
            <span className="font-semibold text-lg">Praxis360</span>
          </Link>
          <span className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold">UMI demo</span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Sign in as a demo role</h1>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base">
            One-click sign-in for each role. All demo accounts belong to{" "}
            <span className="font-mono font-semibold">@umi.ac.ug</span>.
          </p>
          {searchParams?.error && (
            <div className="mt-4 text-sm text-error bg-error-container/60 border border-error/30 rounded-lg px-3 py-2 inline-block">
              Invalid email or password.
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          {ROLE_TILES.map((t) => {
            const TIcon = t.icon;
            return (
              <form action={quickLoginAction} key={t.role} className="h-full">
                <input type="hidden" name="role" value={t.role} />
                <button
                  type="submit"
                  className="w-full h-full text-left rounded-xl border border-outline-variant bg-surface-container-lowest hover:shadow-md hover:border-primary/40 transition p-5 flex flex-col gap-2"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.accent} text-on-primary grid place-items-center`}>
                    <TIcon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="font-semibold text-base">{t.title}</div>
                  <div className="text-xs text-on-surface-variant font-mono break-all">{t.email}</div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t.blurb}</p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-primary inline-flex items-center gap-1">
                    Sign in
                    <Icon.ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        <div className="max-w-md mx-auto mt-12">
          <details className="card-p">
            <summary className="cursor-pointer font-semibold">Or sign in with email &amp; password</summary>
            <form action={loginAction} className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" required defaultValue="student@umi.ac.ug" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input className="input" id="password" name="password" type="password" required defaultValue="password123" />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Sign in</button>
              <p className="text-xs text-on-surface-variant text-center">
                All demo passwords are <span className="font-mono font-semibold">password123</span>.
              </p>
            </form>
          </details>

          <div className="mt-6 text-center text-sm">
            <Link href="/" className="link">← Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
