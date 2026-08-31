import { cn } from "@/lib/utils";
import { slaPillClass, slaStatus } from "@/lib/sla";
import type { LucideIcon } from "@/components/icons";
import { Icon } from "@/components/icons";

export function KPI({
  label,
  value,
  hint,
  tone = "default",
  icon: IconEl,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
  icon?: LucideIcon;
}) {
  const toneClass = {
    default: "text-on-surface",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info",
  }[tone];
  const iconTone = {
    default: "bg-surface-container text-on-surface-variant",
    success: "bg-success-container text-success",
    warning: "bg-warning-container text-warning",
    error: "bg-error-container text-error",
    info: "bg-info-container text-info",
  }[tone];
  return (
    <div className="kpi">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="kpi-label">{label}</div>
          <div className={cn("kpi-value", toneClass)}>{value}</div>
          {hint && <div className="text-xs text-on-surface-variant">{hint}</div>}
        </div>
        {IconEl && (
          <div className={cn("w-9 h-9 rounded-lg grid place-items-center shrink-0", iconTone)}>
            <IconEl className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon: IconEl,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {IconEl && (
          <div className="w-8 h-8 rounded-lg bg-primary-container text-primary grid place-items-center shrink-0">
            <IconEl className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-sm sm:text-base leading-tight truncate">{title}</div>
          {subtitle && <div className="text-xs text-on-surface-variant mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: IconEl,
  actions,
  chips,
  variant = "primary",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  chips?: { icon?: LucideIcon; label: string }[];
  variant?: "primary" | "secondary" | "tertiary";
}) {
  const grad = {
    primary: "from-primary via-primary to-secondary text-on-primary",
    secondary: "from-secondary via-secondary to-tertiary text-on-secondary",
    tertiary: "from-tertiary via-tertiary to-primary text-on-tertiary",
  }[variant];
  return (
    <div className={cn("rounded-2xl p-5 md:p-6 bg-gradient-to-br shadow-card", grad)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {IconEl && (
              <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center">
                <IconEl className="w-5 h-5" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <div className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-bold leading-tight">{title}</h1>
            </div>
          </div>
          {subtitle && <p className="text-sm opacity-90 mt-2">{subtitle}</p>}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              {chips.map((c, idx) => {
                const CIcon = c.icon;
                return (
                  <span key={idx} className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                    {CIcon && <CIcon className="w-3.5 h-3.5" strokeWidth={2} />}
                    {c.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("badge", className)}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" aria-label={`${Math.round(value)}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-p text-center">
      <div className="text-lg font-semibold">{title}</div>
      {hint && <div className="text-sm text-on-surface-variant mt-1">{hint}</div>}
    </div>
  );
}

export function LoopSteps({ steps, current }: { steps: string[]; current: number }) {
  if (!steps.length) return null;
  const safeIndex = Math.min(Math.max(current, 0), steps.length - 1);
  const label = steps[safeIndex];
  const isDone = current >= steps.length - 1;
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          isDone
            ? "bg-success-container text-success"
            : "bg-primary text-on-primary",
        )}
      >
        {label}
      </span>
      <span className="text-xs text-on-surface-variant">
        Step {safeIndex + 1} of {steps.length}
      </span>
    </div>
  );
}

export function SLAPill({
  createdAt,
  priority,
  status,
  resolvedAt,
  showLabel = true,
}: {
  createdAt: Date | string;
  priority: string;
  status: string;
  resolvedAt?: Date | string | null;
  showLabel?: boolean;
}) {
  const info = slaStatus({
    createdAt: typeof createdAt === "string" ? new Date(createdAt) : createdAt,
    priority,
    status,
    resolvedAt: resolvedAt ? (typeof resolvedAt === "string" ? new Date(resolvedAt) : resolvedAt) : null,
  });
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        slaPillClass(info.state),
      )}
      title={`SLA target based on ${priority} priority`}
    >
      <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {showLabel ? info.label : info.state}
    </span>
  );
}

export function AttachmentList({
  attachments,
  title = "Attachments",
}: {
  attachments: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
    createdAt?: Date | string;
  }[];
  title?: string;
}) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="card-p">
      <SectionHeader title={`${title} (${attachments.length})`} icon={Icon.Paperclip} />
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {attachments.map((a) => {
          const isImage = a.mimeType.startsWith("image/");
          return (
            <a
              key={a.id}
              href={a.dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={a.name}
              className="border border-outline-variant rounded-lg overflow-hidden hover:border-primary hover:shadow-sm transition block bg-surface-container-lowest"
              title={a.name}
            >
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.dataUrl} alt={a.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-surface-container-low">
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-primary grid place-items-center">
                    <Icon.Reports className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    PDF document
                  </div>
                </div>
              )}
              <div className="p-2 text-xs">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-on-surface-variant mt-0.5">{(a.size / 1024).toFixed(0)} KB</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function InsightCard({
  severity,
  text,
  action,
}: {
  severity: "critical" | "high" | "medium" | "low";
  text: string;
  action?: string;
}) {
  const map = {
    critical: { border: "border-error/40 bg-error-container", icon: Icon.AtRisk, tint: "bg-error text-on-error" },
    high: { border: "border-error/40 bg-error-container/60", icon: Icon.Flame, tint: "bg-error text-on-error" },
    medium: { border: "border-warning/40 bg-warning-container", icon: Icon.Info, tint: "bg-warning text-on-warning" },
    low: { border: "border-info/40 bg-info-container", icon: Icon.Insights, tint: "bg-info text-on-info" },
  } as const;
  const cfg = map[severity];
  const CIcon = cfg.icon;
  return (
    <div className={cn("border rounded-xl p-4", cfg.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-lg grid place-items-center shrink-0", cfg.tint)}>
          <CIcon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-semibold tracking-widest text-on-surface-variant">
            {severity} priority insight
          </div>
          <div className="text-sm font-medium mt-0.5 text-on-surface">{text}</div>
          {action && (
            <div className="text-xs mt-2 text-on-surface-variant">
              <span className="font-semibold">Recommended action:</span> {action}
            </div>
          )}
          <div className="inline-flex items-center gap-1 text-[10px] mt-2 uppercase tracking-wide text-on-surface-variant">
            <Icon.Ai className="w-3 h-3" strokeWidth={2} />
            AI-generated — review required
          </div>
        </div>
      </div>
    </div>
  );
}
