import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHero, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import {
  saveBrandingAction,
  saveEmailAction,
  saveSlaAction,
  saveRemindersAction,
  saveFeaturesAction,
  testEmailAction,
  runRemindersAction,
} from "./actions";

export const dynamic = "force-dynamic";

function Field({
  label,
  hint,
  children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{label}</div>
      {children}
      {hint ? <div className="text-[11px] text-on-surface-variant mt-1">{hint}</div> : null}
    </label>
  );
}

function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 select-none">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4 accent-primary" />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const s = await getSettings();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="System Administration"
        title="Settings"
        subtitle="Configure branding, email delivery, SLA targets, reminders, and feature flags."
        icon={Icon.Actions}
        chips={[
          { icon: Icon.Bell, label: s.emailEnabled ? "Email ON" : "Email OFF" },
          { icon: Icon.Clock, label: `SLA warn @ ${s.slaWarnPercent}%` },
          { icon: Icon.Ai, label: s.aiEnabled ? "AI ON" : "AI OFF" },
        ]}
      />

      {/* Branding */}
      <form action={saveBrandingAction} className="card-p space-y-4">
        <SectionHeader title="Institution branding" subtitle="Shown in headers, emails, and reports." icon={Icon.Shield} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Institution name">
            <input name="institutionName" defaultValue={s.institutionName} className="input" required />
          </Field>
          <Field label="Primary contact email" hint="Used as a fallback reply-to for outbound emails.">
            <input name="primaryContactEmail" type="email" defaultValue={s.primaryContactEmail ?? ""} className="input" />
          </Field>
        </div>
        <div><button className="btn-primary inline-flex items-center gap-1.5"><Icon.Check className="w-4 h-4" />Save branding</button></div>
      </form>

      {/* Email */}
      <form action={saveEmailAction} className="card-p space-y-4">
        <SectionHeader
          title="Email delivery (SMTP)"
          subtitle="Push notifications to users via email. Works with any SMTP provider (Gmail app password, SendGrid, Postmark, Mailgun, Amazon SES, etc.)."
          icon={Icon.Bell}
        />
        <div className="flex items-center gap-4 flex-wrap">
          <Toggle name="emailEnabled" defaultChecked={s.emailEnabled} label="Enable outbound email" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="SMTP host" hint="e.g. smtp.gmail.com, smtp.sendgrid.net"><input name="smtpHost" defaultValue={s.smtpHost ?? ""} className="input" /></Field>
          <Field label="SMTP port" hint="465 for SSL, 587 for STARTTLS"><input name="smtpPort" type="number" defaultValue={s.smtpPort ?? 587} className="input" /></Field>
          <Field label="SMTP username"><input name="smtpUser" defaultValue={s.smtpUser ?? ""} className="input" autoComplete="off" /></Field>
          <Field label="SMTP password / app password" hint="Stored in plaintext in the demo DB — use a dedicated app password.">
            <input name="smtpPass" type="password" defaultValue={s.smtpPass ?? ""} className="input" autoComplete="new-password" />
          </Field>
          <Field label="From name"><input name="emailFromName" defaultValue={s.emailFromName} className="input" /></Field>
          <Field label="From address"><input name="emailFromAddress" type="email" defaultValue={s.emailFromAddress ?? ""} className="input" placeholder="noreply@example.edu" /></Field>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Toggle name="smtpSecure" defaultChecked={s.smtpSecure} label="Use SSL (secure)" />
          <button className="btn-primary inline-flex items-center gap-1.5"><Icon.Check className="w-4 h-4" />Save email settings</button>
        </div>
      </form>

      {/* Test email */}
      <form action={testEmailAction} className="card-p space-y-3">
        <SectionHeader title="Send test email" subtitle="Verify SMTP by sending a test message." icon={Icon.Send} />
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-64">
            <Field label="Send to"><input name="testEmailTo" type="email" required className="input" placeholder="you@example.com" /></Field>
          </div>
          <button className="btn-outline inline-flex items-center gap-1.5"><Icon.Send className="w-4 h-4" />Send test</button>
        </div>
        {!s.emailEnabled && (
          <div className="text-xs text-warning-container-foreground bg-warning-container/40 rounded-lg p-2 inline-flex items-center gap-2">
            <Icon.AtRisk className="w-4 h-4" /> Email is currently disabled — enable it above before sending.
          </div>
        )}
      </form>

      {/* SLA */}
      <form action={saveSlaAction} className="card-p space-y-4">
        <SectionHeader title="SLA targets" subtitle="Hours from issue submission until it must be resolved, per priority." icon={Icon.Clock} />
        <div className="grid md:grid-cols-5 gap-4">
          <Field label="Critical (hrs)"><input name="slaCriticalHours" type="number" min={1} defaultValue={s.slaCriticalHours} className="input" /></Field>
          <Field label="High (hrs)"><input name="slaHighHours" type="number" min={1} defaultValue={s.slaHighHours} className="input" /></Field>
          <Field label="Medium (hrs)"><input name="slaMediumHours" type="number" min={1} defaultValue={s.slaMediumHours} className="input" /></Field>
          <Field label="Low (hrs)"><input name="slaLowHours" type="number" min={1} defaultValue={s.slaLowHours} className="input" /></Field>
          <Field label="Warn at (%)" hint="Send warning when this % of SLA is consumed.">
            <input name="slaWarnPercent" type="number" min={1} max={99} defaultValue={s.slaWarnPercent} className="input" />
          </Field>
        </div>
        <div><button className="btn-primary inline-flex items-center gap-1.5"><Icon.Check className="w-4 h-4" />Save SLA</button></div>
      </form>

      {/* Reminders */}
      <form action={saveRemindersAction} className="card-p space-y-4">
        <SectionHeader
          title="Automatic reminders"
          subtitle="Reminders are emitted by /api/cron/reminders. Point an external scheduler (cron-job.org, Render Cron, GitHub Actions) at that URL to run continuously — or use the button below for manual runs."
          icon={Icon.Bell}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Toggle name="reminderSlaEnabled" defaultChecked={s.reminderSlaEnabled} label="SLA warning + breach reminders" />
          <Toggle name="reminderEvaluationEnabled" defaultChecked={s.reminderEvaluationEnabled} label="Course evaluation deadline reminders" />
          <Field label="Evaluation reminder — days before deadline">
            <input name="reminderEvaluationDaysBefore" type="number" min={1} max={30} defaultValue={s.reminderEvaluationDaysBefore} className="input" />
          </Field>
          <Field label="Cooldown between reminders (hours)" hint="Prevents spamming the same recipient about the same item.">
            <input name="reminderCooldownHours" type="number" min={1} defaultValue={s.reminderCooldownHours} className="input" />
          </Field>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-primary inline-flex items-center gap-1.5"><Icon.Check className="w-4 h-4" />Save reminders</button>
        </div>
      </form>

      {/* Manual reminder run */}
      <form action={runRemindersAction} className="card-p flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold">Run reminder job now</div>
          <div className="text-xs text-on-surface-variant">Scans open issues + open evaluation windows and dispatches due reminders (in-app + email if enabled).</div>
        </div>
        <button className="btn-outline inline-flex items-center gap-1.5"><Icon.Send className="w-4 h-4" />Run now</button>
      </form>

      {/* Feature flags */}
      <form action={saveFeaturesAction} className="card-p space-y-4">
        <SectionHeader title="Feature flags" subtitle="Toggle major capabilities without deploying." icon={Icon.Ai} />
        <div className="grid md:grid-cols-2 gap-3">
          <Toggle name="aiEnabled" defaultChecked={s.aiEnabled} label="AI Insights (classification, sentiment, spikes)" />
          <Toggle name="communityBoardEnabled" defaultChecked={s.communityBoardEnabled} label="Community issue board + upvotes" />
          <Toggle name="voiceEnabled" defaultChecked={s.voiceEnabled} label="Student voice (QA voice inbox)" />
          <Toggle name="duplicateDetectionEnabled" defaultChecked={s.duplicateDetectionEnabled} label="Duplicate issue detection at submission time" />
        </div>
        <div><button className="btn-primary inline-flex items-center gap-1.5"><Icon.Check className="w-4 h-4" />Save features</button></div>
      </form>

      <div className="text-xs text-on-surface-variant">
        Last updated {new Date(s.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
