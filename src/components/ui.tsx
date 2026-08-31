import { cn } from "@/lib/utils";
import { slaPillClass, slaStatus } from "@/lib/sla";

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
  const dot =
    info.state === "resolved" ? "●"
      : info.state === "breached" ? "●"
      : info.state === "warning" ? "●"
      : info.state === "watch" ? "●"
      : "●";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", slaPillClass(info.state))} title={`SLA target based on ${priority} priority`}>
      <span aria-hidden>{dot}</span>
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
      <div className="section-title mb-3">📎 {title} ({attachments.length})</div>
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
              className="border border-outline-variant rounded-lg overflow-hidden hover:border-primary transition block bg-surface-container-lowest"
              title={a.name}
            >
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.dataUrl} alt={a.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex flex-col items-center justify-center bg-surface-container-low">
                  <div className="text-3xl">📄</div>
                  <div className="text-xs text-on-surface-variant mt-1">PDF</div>
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
