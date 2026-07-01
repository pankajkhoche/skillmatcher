import React, { useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, MapPin, DollarSign, Briefcase, ArrowRight, Bookmark } from "lucide-react";

export default function Jobs() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState("real");

  const load = async () => {
    setLoading(true);
    try {
      if (tab === "real") {
        const r = await api.get("/jobs/real", { timeout: 30000 });
        setJobs((r.data.jobs || []).map(j => ({ ...j, match_reason: j.matched_skills?.length ? `Matches ${j.matched_skills.join(", ")}` : "Matched by role/skills", key_requirements: j.matched_skills || [] })));
      } else {
        const r = await api.post("/jobs/suggest", {}, { timeout: 90000 });
        setJobs(r.data.jobs || []);
      }
      toast.success("Fresh matches");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const scoreCls = (s) => s >= 80 ? "text-[#22D3EE] border-[#22D3EE]/30 bg-[#22D3EE]/10" : s >= 60 ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-zinc-400 border-white/10 bg-white/[0.03]";

  const saveJob = async (j) => {
    try {
      const r = await api.post("/jobs/save", { title: j.title, company: j.company, location: j.location, salary_range: j.salary_range, match_score: j.match_score, url: j.url || "", source: tab });
      toast.success(r.data.already_saved ? "Already saved" : "Bookmarked → tracker");
    } catch { toast.error("Save failed"); }
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-10">
          <div>
            <div className="overline mb-3">Job matches</div>
            <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Roles that <span className="text-[#22D3EE] italic">fit you.</span></h1>
          </div>
          <button data-testid="jobs-refresh" onClick={load} disabled={loading} className="brand-bg text-white font-medium px-5 py-3 rounded-xl brand-bg-hover transition-all brand-glow inline-flex items-center gap-2 disabled:opacity-40">
            <Sparkles size={16} strokeWidth={2}/> {loading ? "Finding…" : "Find matches"}
          </button>
        </div>
        <div className="flex gap-2 border-b border-white/[0.06] mb-6">
          {[["real","Real Jobs (Remotive)"],["ai","AI Curated"]].map(([id,label])=>(
            <button key={id} data-testid={`jobs-tab-${id}`} onClick={()=>{setTab(id); setJobs([]);}} className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab===id? "border-cyan-400 text-white":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{label}</button>
          ))}
        </div>

        {jobs.length === 0 && !loading && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto mb-4 flex items-center justify-center">
              <Briefcase size={22} className="text-zinc-500" strokeWidth={1.5}/>
            </div>
            <p className="text-zinc-500">Click <span className="text-[#22D3EE]">Find matches</span> to see roles curated for you.</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-16 text-center animate-pulse">
            <div className="font-heading text-2xl font-light text-zinc-400">Searching the market…</div>
            <div className="overline mt-3">Claude Sonnet 4.5</div>
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((j, i) => (
            <div key={i} className="group rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6 card-hover" data-testid={`job-${i}`}>
              <div className="flex justify-between items-start gap-6 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-2xl font-medium mb-1.5 flex items-center gap-2">
                    {j.title}
                    <ArrowRight size={16} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5}/>
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <span className="text-white font-medium">{j.company}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={12} strokeWidth={1.5}/> {j.location}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={12} strokeWidth={1.5}/> {j.type}</span>
                    {j.salary_range && <span className="inline-flex items-center gap-1"><DollarSign size={12} strokeWidth={1.5}/> {j.salary_range}</span>}
                  </div>
                </div>
                <div className={`border rounded-xl px-4 py-2.5 text-center min-w-[80px] ${scoreCls(j.match_score)}`}>
                  <div className="font-heading text-2xl font-light">{j.match_score}</div>
                  <div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-0.5">Match</div>
                </div>
                <button onClick={()=>saveJob(j)} data-testid={`job-save-${i}`} className="w-10 h-10 rounded-xl border border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 text-zinc-400 flex items-center justify-center"><Bookmark size={16} strokeWidth={1.5}/></button>
              </div>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{j.match_reason}</p>
              {j.key_requirements?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {j.key_requirements.map((r,k)=>(<span key={k} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-400 border border-white/10 font-mono">{r}</span>))}
                </div>
              )}
              {j.why_you_fit && (
                <p className="text-sm mt-4 p-4 rounded-xl border border-[#22D3EE]/15 bg-[#22D3EE]/[0.03] text-zinc-300 leading-relaxed">
                  <span className="text-[#22D3EE] font-medium">Why you fit — </span>{j.why_you_fit}
                </p>
              )}
              {j.url && (
                <a href={j.url} target="_blank" rel="noopener noreferrer" data-testid={`job-apply-${i}`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-cyan-300 hover:text-cyan-100 font-medium">Apply on Remotive →</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
