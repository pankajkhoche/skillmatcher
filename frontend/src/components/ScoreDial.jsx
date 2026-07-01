import React from "react";

export default function ScoreDial({ score = 0, size = 200, label = "ATS Score" }) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  // Interpolate zinc -> amber
  const color = s >= 80 ? "#C084FC" : s >= 50 ? "#F59E0B" : "#71717A";

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="score-dial" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <defs>
          <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71717A" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#dialGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="text-center relative z-10">
        <div className="font-heading font-light text-6xl tracking-tighter" data-testid="score-value">{s}</div>
        <div className="overline mt-1">{label}</div>
      </div>
    </div>
  );
}
