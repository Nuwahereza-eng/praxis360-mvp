import { cn } from "@/lib/utils";

// Praxis360 palette (matches DESIGN.md tokens)
const P = {
  primary: "#002045",
  secondary: "#13696a",
  tertiary: "#c26a00",
  success: "#15803d",
  warning: "#b45309",
  error: "#b91c1c",
  info: "#1e40af",
  muted: "#e5e7eb",
  ink: "#1f2937",
  sub: "#6b7280",
};

const PALETTE = [P.primary, P.secondary, P.tertiary, P.info, P.success, P.warning, P.error, "#7c3aed", "#0891b2", "#db2777"];

// ---------------------------------------------------------------------------
// BarChart — horizontal or vertical, labeled bars with values
// ---------------------------------------------------------------------------
export function BarChart({
  data,
  height = 220,
  orientation = "vertical",
  color = P.primary,
  valueSuffix = "",
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  orientation?: "vertical" | "horizontal";
  color?: string;
  valueSuffix?: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (orientation === "horizontal") {
    const rowH = 28;
    const totalH = data.length * rowH + 8;
    return (
      <svg viewBox={`0 0 400 ${totalH}`} className={cn("w-full h-auto", className)} role="img">
        {data.map((d, i) => {
          const barW = (d.value / max) * 240;
          return (
            <g key={i} transform={`translate(0, ${i * rowH + 4})`}>
              <text x={0} y={16} className="fill-current" style={{ fontSize: 11, fill: P.ink }}>
                {d.label}
              </text>
              <rect x={140} y={6} width={240} height={14} rx={4} fill={P.muted} />
              <rect x={140} y={6} width={barW} height={14} rx={4} fill={d.color || color} />
              <text x={140 + barW + 4} y={17} style={{ fontSize: 10, fill: P.sub }}>
                {d.value}{valueSuffix}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }
  // Vertical
  const w = 400;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 36;
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const step = chartW / Math.max(1, data.length);
  const barW = Math.min(40, step * 0.6);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={cn("w-full h-auto", className)} role="img">
      {/* y-axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + chartH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={P.muted} strokeDasharray="2 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" style={{ fontSize: 9, fill: P.sub }}>
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const h = (d.value / max) * chartH;
        const y = padT + chartH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={d.color || color} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" style={{ fontSize: 10, fill: P.ink, fontWeight: 600 }}>
              {d.value}{valueSuffix}
            </text>
            <text x={x + barW / 2} y={height - padB + 14} textAnchor="middle" style={{ fontSize: 10, fill: P.sub }}>
              {truncate(d.label, 14)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DonutChart — categorical breakdown with a total in the center
// ---------------------------------------------------------------------------
export function DonutChart({
  data,
  size = 200,
  thickness = 28,
  centerLabel,
  centerValue,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = size / 2 - thickness / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-4", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.muted} strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * C;
          const gap = C - dash;
          const offset = -acc;
          acc += dash;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color || PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
        {(centerValue !== undefined || centerLabel) && (
          <g style={{ transform: `rotate(90deg) translate(-${size}px, 0)`, transformOrigin: "center" }}>
            {centerValue !== undefined && (
              <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: P.ink }}>
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: P.sub }}>
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>
      <ul className="text-sm space-y-1 min-w-0">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span className="truncate">{d.label}</span>
            <span className="ml-auto text-on-surface-variant font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LineChart — one or more series over labeled x-axis
// ---------------------------------------------------------------------------
export function LineChart({
  labels,
  series,
  height = 220,
  yMax,
  ySuffix = "",
  className,
}: {
  labels: string[];
  series: { name: string; values: number[]; color?: string }[];
  height?: number;
  yMax?: number;
  ySuffix?: string;
  className?: string;
}) {
  const w = 480;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 32;
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const max = yMax ?? Math.max(1, ...series.flatMap((s) => s.values));
  const step = chartW / Math.max(1, labels.length - 1);
  const x = (i: number) => padL + step * i;
  const y = (v: number) => padT + chartH - (v / max) * chartH;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={cn("w-full h-auto", className)} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const yy = padT + chartH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke={P.muted} strokeDasharray="2 3" />
            <text x={padL - 6} y={yy + 3} textAnchor="end" style={{ fontSize: 9, fill: P.sub }}>
              {Math.round(max * t)}{ySuffix}
            </text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - padB + 14} textAnchor="middle" style={{ fontSize: 10, fill: P.sub }}>
          {truncate(l, 12)}
        </text>
      ))}
      {series.map((s, si) => {
        const color = s.color || PALETTE[si % PALETTE.length];
        const d = s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />
            ))}
          </g>
        );
      })}
      {series.length > 1 && (
        <g transform={`translate(${padL}, 0)`}>
          {series.map((s, si) => (
            <g key={si} transform={`translate(${si * 100}, 0)`}>
              <rect x={0} y={0} width={10} height={10} fill={s.color || PALETTE[si % PALETTE.length]} rx={2} />
              <text x={14} y={9} style={{ fontSize: 10, fill: P.ink }}>{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// StackedBar — horizontal bar segmented by category (for status pipelines)
// ---------------------------------------------------------------------------
export function StackedBar({
  segments,
  height = 22,
  className,
}: {
  segments: { label: string; value: number; color?: string }[];
  height?: number;
  className?: string;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex w-full rounded-lg overflow-hidden bg-surface-container" style={{ height }}>
        {segments.map((s, i) => {
          if (s.value === 0) return null;
          const w = (s.value / total) * 100;
          return (
            <div
              key={i}
              title={`${s.label}: ${s.value}`}
              style={{ width: `${w}%`, background: s.color || PALETTE[i % PALETTE.length] }}
              className="grid place-items-center text-[10px] font-semibold text-white"
            >
              {w > 8 ? s.value : ""}
            </div>
          );
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color || PALETTE[i % PALETTE.length] }} />
            <span className="text-on-surface-variant">{s.label}</span>
            <span className="font-medium">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gauge — single-value semi-circle gauge (for KPI sparkles)
// ---------------------------------------------------------------------------
export function Gauge({
  value,
  max = 100,
  label,
  suffix = "%",
  color,
  size = 160,
}: {
  value: number;
  max?: number;
  label?: string;
  suffix?: string;
  color?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const c = color || (pct > 0.7 ? P.success : pct > 0.4 ? P.warning : P.error);
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const C = Math.PI * r; // half circumference
  const dash = pct * C;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size / 2 + 16}`} width={size} role="img">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={P.muted}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={c}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: P.ink }}>
          {Math.round(value)}{suffix}
        </text>
        {label && (
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: P.sub }}>
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export const CHART_COLORS = P;
