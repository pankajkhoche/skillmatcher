import React from "react";

export default function ScoreDial({ score = 0, size = 180, label = "ATS Score" }) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const color = s >= 80 ? "hsl(152, 60%, 45%)" : s >= 50 ? "hsl(38, 92%, 55%)" : "hsl(0, 84%, 55%)";

  return (
    <div className="inline-flex flex-col items-center gap-2" data-testid="score-dial">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#000" strokeWidth={stroke} fill="none" opacity={0.08} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="-mt-[calc(50%+8px)] text-center pointer-events-none" style={{ marginTop: -(size / 2 + 24) }}>
        <div className="font-display font-black text-5xl" data-testid="score-value">{s}</div>
        <div className="text-[10px] tracking-[0.25em] font-bold uppercase">{label}</div>
      </div>
      <div style={{ height: size / 2 - 20 }} />
    </div>
  );
}
