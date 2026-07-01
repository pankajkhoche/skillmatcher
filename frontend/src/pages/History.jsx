import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { FileText, Sparkles, MessageSquare, Trophy } from "lucide-react";

export default function History() {
  const [resumes, setResumes] = useState([]);
  const [rewrites, setRewrites] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tab, setTab] = useState("resumes");

  useEffect(() => {
    api.get("/history/resumes").then(r => setResumes(r.data.items || [])).catch(()=>{});
    api.get("/history/rewrites").then(r => setRewrites(r.data.items || [])).catch(()=>{});
    api.get("/interview/history").then(r => setInterviews(r.data.items || [])).catch(()=>{});
  }, []);

  const tabs = [
    { id: "resumes", label: "Resume Analyses", count: resumes.length, icon: <FileText size={14}/> },
    { id: "rewrites", label: "AI Rewrites", count: rewrites.length, icon: <Sparkles size={14}/> },
    { id: "interviews", label: "Interviews", count: interviews.length, icon: <MessageSquare size={14}/> },
  ];

  const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return ""; } };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-8">
          <div className="overline mb-3">Timeline</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Your journey, <span className="brand-text italic">tracked.</span></h1>
        </div>

        <div className="flex gap-2 border-b border-white/[0.06] mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} data-testid={`history-tab-${t.id}`} className={`px-4 py-3 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-all ${tab===t.id? "border-purple-400 text-white":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>
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
                </div>
                <div className="text-right">
                  <div className="font-heading font-light text-3xl brand-text">{iv.scorecard?.overall_score ?? "—"}</div>
                  <div className="overline"><Trophy size={10} className="inline"/> {iv.status === "completed" ? "Done" : "In progress"}</div>
                </div>
              </div>
            </div>
          ))}
          {((tab==="resumes"&&!resumes.length)||(tab==="rewrites"&&!rewrites.length)||(tab==="interviews"&&!interviews.length)) && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 text-center text-zinc-500">No {tab} yet. Start using TalentIQ to build your timeline.</div>
          )}
        </div>
      </div>
    </div>
  );
}
