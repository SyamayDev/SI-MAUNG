/** Circular progress (SVG). The percentage is always also given as text nearby. */
export default function ProgressRing({ value = 0, size = 72, stroke = 8, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--c-surface-3)" }} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        style={{ stroke: v >= 1 ? "var(--c-income-fill)" : "var(--c-amber)", transition: "stroke-dasharray 600ms var(--ease-out)" }}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * v} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontWeight="800" fontSize={size * 0.24} style={{ fill: "var(--c-ink)" }}>
        {Math.round(v * 100)}%
      </text>
    </svg>
  );
}
