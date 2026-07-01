import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { FileText, Sparkles, MessageSquare, Trophy, Eye, TrendingUp, TrendingDown, Minus, Video } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function History() {
  const [resumes, setResumes] = useState([]);
  const [rewrites, setRewrites] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [trends, setTrends] = useState(null);
  const [tab, setTab] = useState("resumes");

  useEffect(() => {
    const warn = (label) => (e) => console.warn(`history ${label} failed`, e?.response?.status);
    api.get("/history/resumes").then(r => setResumes(r.data.items || [])).catch(warn("resumes"));
    api.get("/history/rewrites").then(r => setRewrites(r.data.items || [])).catch(warn("rewrites"));
    api.get("/interview/history").then(r => setInterviews(r.data.items || [])).catch(warn("interviews"));
    api.get("/interview/body-language/trends").then(r => setTrends(r.data)).catch(warn("bl-trends"));
  }, []);

  const tabs = [
    { id: "resumes", label: "Resume Analyses", count: resumes.length, icon: <FileText size={14}/> },
    { id: "rewrites", label: "AI Rewrites", count: rewrites.length, icon: <Sparkles size={14}/> },
    { id: "interviews", label: "Interviews", count: interviews.length, icon: <MessageSquare size={14}/> },
    { id: "body", label: "Body Language", count: trends?.timeline?.length || 0, icon: <Video size={14}/> },
  ];

  const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return ""; } };
  const fmtShort = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; } };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-8">
          <div className="overline mb-3">Timeline</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Your journey, <span className="brand-text italic">tracked.</span></h1>
        </div>

        <div className="flex gap-2 border-b border-white/[0.06] mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} data-testid={`history-tab-${t.id}`} className={`px-4 py-3 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${tab===t.id? "border-cyan-400 text-white":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.icon} {t.label} <span className="font-mono text-xs text-zinc-600">({t.count})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === "resumes" && resumes.map((r,i)=>(
            <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5 card-hover" data-testid={`history-resume-${i}`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-heading text-lg font-medium">{r.filename}</h3>
                  <div className="overline mt-1">{fmt(r.created_at)}</div>
                  <p className="text-sm text-zinc-400 mt-2 italic">{r.analysis?.one_line_summary}</p>
                </div>
                <div className="text-right">
                  <div className="font-heading font-light text-3xl brand-text">{r.analysis?.ats_score}</div>
                  <div className="overline">ATS</div>
                </div>
              </div>
            </div>
          ))}
          {tab === "rewrites" && rewrites.map((r,i)=>(
            <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5 card-hover" data-testid={`history-rewrite-${i}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="overline">{fmt(r.created_at)}</div>
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{r.job_description?.slice(0, 200)}…</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading text-sm text-zinc-500">{r.result?.match_score_before} → <span className="brand-text text-2xl font-light">{r.result?.match_score_after}</span></div>
                  <div className="overline">Match</div>
                </div>
              </div>
            </div>
          ))}
          {tab === "interviews" && interviews.map((iv,i)=>(
            <div key={iv.id} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5 card-hover" data-testid={`history-interview-${i}`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-heading text-lg font-medium">{iv.role}</h3>
                  <div className="overline mt-1">{fmt(iv.created_at)} · {iv.difficulty}</div>
                  {iv.scorecard?.verdict && <p className="text-sm text-zinc-400 mt-2 italic">{iv.scorecard.verdict}</p>}
                  {iv.scorecard?.body_language && (
                    <div className="flex gap-3 mt-3 text-xs font-mono">
                      <span className="text-zinc-500">Eye: <span className="text-cyan-300">{iv.scorecard.body_language.avg_eye_contact_pct}%</span></span>
                      <span className="text-zinc-500">Posture: <span className="text-cyan-300">{iv.scorecard.body_language.avg_posture_score}%</span></span>
                      <span className="text-zinc-500">Presence: <span className="text-cyan-300">{iv.scorecard.body_language.presence_score}</span></span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-heading font-light text-3xl brand-text">{iv.scorecard?.overall_score ?? "—"}</div>
                  <div className="overline"><Trophy size={10} className="inline"/> {iv.status === "completed" ? "Done" : "In progress"}</div>
                </div>
              </div>
            </div>
          ))}
          {tab === "body" && <BodyLanguageTrends trends={trends} fmt={fmt} fmtShort={fmtShort}/>}

          {((tab==="resumes"&&!resumes.length)||(tab==="rewrites"&&!rewrites.length)||(tab==="interviews"&&!interviews.length)) && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 text-center text-zinc-500">No {tab} yet. Start using TalentIQ to build your timeline.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ direction, delta }) {
  const map = {
    improving: { icon: <TrendingUp size={12}/>, color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10", label: "Improving" },
    declining: { icon: <TrendingDown size={12}/>, color: "text-red-300 border-red-400/40 bg-red-500/10", label: "Declining" },
    steady: { icon: <Minus size={12}/>, color: "text-amber-300 border-amber-400/40 bg-amber-500/10", label: "Steady" },
  };
  const m = map[direction] || map.steady;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-mono text-[10px] ${m.color}`} data-testid="bl-trend-badge">
      {m.icon} {m.label} {delta ? `${delta > 0 ? "+" : ""}${delta}` : ""}
    </span>
  );
}

function BodyLanguageTrends({ trends, fmt, fmtShort }) {
  if (!trends || !trends.timeline?.length) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 text-center text-zinc-500" data-testid="bl-empty">
        <Video size={32} className="mx-auto mb-4 text-zinc-700"/>
        <p>No video interviews yet.</p>
        <p className="text-xs mt-2">Complete a video interview to start tracking your presence over time.</p>
      </div>
    );
  }

  const s = trends.summary;
  const chartData = trends.timeline.map((t, i) => ({
    label: `#${i + 1} · ${fmtShort(t.created_at)}`,
    role: t.role,
    "Eye Contact": t.avg_eye_contact_pct,
    "Posture": t.avg_posture_score,
    "Presence": t.presence_score,
  }));

  return (
    <div className="space-y-4" data-testid="bl-trends">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={<Eye size={14}/>} label="Avg Eye Contact" value={`${s.overall_avg_eye_contact_pct}%`} testid="bl-avg-eye"/>
        <SummaryTile icon={<Video size={14}/>} label="Avg Posture" value={`${s.overall_avg_posture_score}%`} testid="bl-avg-posture"/>
        <SummaryTile icon={<Trophy size={14}/>} label="Interviews" value={s.total_interviews} testid="bl-total"/>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5 flex flex-col justify-center" data-testid="bl-trend-tile">
          <div className="overline mb-2">Trend</div>
          <TrendBadge direction={s.trend_direction} delta={s.trend_delta}/>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6" data-testid="bl-chart">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-cyan-400"/>
          <h3 className="font-heading text-lg font-medium">Presence over time</h3>
          <span className="ml-auto font-mono text-xs text-zinc-600">{trends.timeline.length} interviews</span>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 8, left: -10 }}>
              <CartesianGrid stroke="#1a1a24" vertical={false}/>
              <XAxis dataKey="label" stroke="#4a4a52" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false}/>
              <YAxis stroke="#4a4a52" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: "#0A0A12", border: "1px solid #22D3EE33", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }}/>
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }}/>
              <Line type="monotone" dataKey="Eye Contact" stroke="#22D3EE" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              <Line type="monotone" dataKey="Posture" stroke="#FB923C" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              <Line type="monotone" dataKey="Presence" stroke="#a5f3fc" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best / recent list */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-6" data-testid="bl-best">
          <div className="flex items-center gap-2 mb-2"><Trophy size={14} className="text-cyan-400"/><div className="overline">Your best interview</div></div>
          <h3 className="font-heading text-xl font-light">{s.best_interview.role}</h3>
          <p className="text-xs text-zinc-500 mt-1">{fmt(s.best_interview.created_at)}</p>
          <div className="font-heading text-5xl font-light brand-text mt-3">{s.best_interview.presence_score}<span className="text-lg text-zinc-600">/100</span></div>
          <div className="overline mt-1">presence score</div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6" data-testid="bl-per-question">
          <div className="flex items-center gap-2 mb-3"><Eye size={14} className="text-cyan-400"/><div className="overline">Per-question averages</div></div>
          {s.per_question_avg?.length ? (
            <div className="space-y-2">
              {s.per_question_avg.map(q => (
                <div key={q.question_index} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-zinc-600 w-8">Q{q.question_index + 1}</span>
                  <div className="flex-1 flex gap-2">
                    <MiniBar label="Eye" value={q.avg_eye_contact_pct} color="bg-cyan-400"/>
                    <MiniBar label="Posture" value={q.avg_posture_score} color="bg-orange-400"/>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-zinc-500">No per-question data yet.</p>}
        </div>
      </div>

      {/* All interviews list */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
        <div className="overline mb-4">All video interviews</div>
        <div className="space-y-2">
          {[...trends.timeline].reverse().map((t, i) => (
            <div key={t.id} className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-none" data-testid={`bl-item-${i}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.role}</div>
                <div className="text-[10px] font-mono text-zinc-600">{fmt(t.created_at)}</div>
              </div>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-zinc-500">Eye <span className="text-cyan-300">{t.avg_eye_contact_pct}%</span></span>
                <span className="text-zinc-500">Post <span className="text-orange-300">{t.avg_posture_score}%</span></span>
                <span className="text-zinc-500">Pres <span className="brand-text">{t.presence_score}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value, testid }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5" data-testid={testid}>
      <div className="flex items-center gap-2 text-zinc-500 mb-2">{icon}<div className="overline">{label}</div></div>
      <div className="font-heading font-light text-3xl brand-text">{value}</div>
    </div>
  );
}

function MiniBar({ label, value, color }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] font-mono text-zinc-600 mb-1">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, value)}%` }}/>
      </div>
    </div>
  );
}
