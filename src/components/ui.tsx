import { cn } from "@/lib/utils";

export function KPI({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "success" | "warning" | "error" | "info" }) {
  const toneClass = {
    default: "text-on-surface",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info",
  }[tone];
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={cn("kpi-value", toneClass)}>{value}</div>
      {hint && <div className="text-xs text-on-surface-variant">{hint}</div>}
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
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn(
            "px-2.5 py-1 rounded-full font-semibold",
            i < current ? "bg-success-container text-success"
              : i === current ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant",
          )}>
            {s}
          </span>
          {i < steps.length - 1 && <span className="text-on-surface-variant">→</span>}
        </li>
      ))}
    </ol>
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
    critical: "border-error/40 bg-error-container",
    high: "border-error/40 bg-error-container/60",
    medium: "border-warning/40 bg-warning-container",
    low: "border-info/40 bg-info-container",
  } as const;
  return (
    <div className={cn("border rounded-xl p-4", map[severity])}>
      <div className="text-xs uppercase font-semibold tracking-wide">{severity} priority insight</div>
      <div className="text-sm font-medium mt-1 text-on-surface">{text}</div>
      {action && (
        <div className="text-xs mt-2 text-on-surface-variant">
          <span className="font-semibold">Recommended action:</span> {action}
        </div>
      )}
      <div className="text-[10px] mt-2 uppercase tracking-wide text-on-surface-variant">
        AI-generated suggestion — review required
      </div>
    </div>
  );
}
