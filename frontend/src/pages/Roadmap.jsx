import React, { useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Target, BookOpen, Award, TrendingUp } from "lucide-react";

export default function Roadmap() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState(user?.target_role || "");
  const [loading, setLoading] = useState(false);
  const [rm, setRm] = useState(null);

  const generate = async () => {
    if (!targetRole) return toast.error("Enter your target role");
    setLoading(true); setRm(null);
    try {
      const r = await api.post("/roadmap/generate", { current_role: currentRole, target_role: targetRole, skills: user?.skills || [] }, { timeout: 120000 });
      setRm(r.data);
      toast.success("Roadmap ready");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="overline mb-3">Career Roadmap</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Your 12-month <span className="brand-text italic">trajectory.</span></h1>
        </div>

        <div className="glass rounded-2xl p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="overline block mb-2">Current Role (optional)</label>
              <input data-testid="rm-current" value={currentRole} onChange={(e)=>setCurrentRole(e.target.value)} placeholder="Junior Engineer, Student…" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-400/50 placeholder:text-zinc-700"/>
            </div>
            <div>
              <label className="overline block mb-2">Target Role</label>
              <input data-testid="rm-target" value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} placeholder="Staff Engineer, Head of Product…" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-400/50 placeholder:text-zinc-700"/>
            </div>
          </div>
          <button onClick={generate} disabled={loading} data-testid="rm-generate" className="w-full brand-bg brand-bg-hover text-white font-medium py-3.5 rounded-xl brand-glow inline-flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? "Building roadmap…" : (<><Sparkles size={16}/> Generate 12-month roadmap</>)}
          </button>
        </div>

        {rm && (
          <div className="space-y-6 fade-up" data-testid="rm-result">
            <div className="glass rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><div className="overline mb-1">From</div><div className="font-heading text-xl">{rm.current_position}</div></div>
                <div><div className="overline mb-1">To</div><div className="font-heading text-xl brand-text">{rm.target_position}</div></div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{rm.gap_analysis}</p>
              {rm.estimated_salary_impact && <div className="mt-4 p-4 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.03] text-sm"><TrendingUp size={14} className="inline text-cyan-400 mr-1.5"/> <b className="brand-text">Salary impact:</b> <span className="text-zinc-300">{rm.estimated_salary_impact}</span></div>}
            </div>

            <div>
              <div className="overline mb-4">Phases</div>
              <div className="border-l border-white/10 ml-4 space-y-6">
                {rm.phases?.map((p) => (
                  <div key={p.phase} className="relative pl-8">
                    <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[#0A0A12] border-2 border-cyan-400/50 flex items-center justify-center font-mono text-[10px] text-cyan-400">{p.phase}</div>
                    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 className="font-heading text-xl font-medium">{p.title}</h3>
                        <div className="overline">{p.duration}</div>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">{p.focus}</p>
                      {p.milestones?.length > 0 && (
                        <div className="mb-3">
                          <div className="overline mb-1.5"><Target size={11} className="inline mr-1"/> Milestones</div>
                          <ul className="space-y-1 text-sm text-zinc-300">{p.milestones.map((m,i)=>(<li key={i}>→ {m}</li>))}</ul>
                        </div>
                      )}
                      {p.skills_to_learn?.length > 0 && (
                        <div className="mb-3">
                          <div className="overline mb-1.5">Skills</div>
                          <div className="flex flex-wrap gap-1">{p.skills_to_learn.map((s,i)=>(<span key={i} className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">{s}</span>))}</div>
                        </div>
                      )}
                      {p.resources?.length > 0 && (
                        <div className="mb-3">
                          <div className="overline mb-1.5"><BookOpen size={11} className="inline mr-1"/> Resources</div>
                          <ul className="text-sm text-zinc-400 space-y-0.5">{p.resources.map((r,i)=>(<li key={i}>· <span className="text-zinc-300">{r.name}</span> <span className="text-zinc-600 font-mono text-xs">({r.type})</span></li>))}</ul>
                        </div>
                      )}
                      {p.success_metric && <div className="text-xs text-cyan-300 mt-3">✓ Success: {p.success_metric}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rm.monthly_habits?.length > 0 && (
              <div className="glass rounded-2xl p-6"><div className="overline mb-3">Monthly Habits</div><ul className="grid md:grid-cols-2 gap-2 text-sm text-zinc-300">{rm.monthly_habits.map((h,i)=>(<li key={i}>· {h}</li>))}</ul></div>
            )}
            {rm.certifications?.length > 0 && (
              <div className="glass rounded-2xl p-6"><div className="overline mb-3"><Award size={11} className="inline mr-1"/> Certifications</div><div className="flex flex-wrap gap-1.5">{rm.certifications.map((c,i)=>(<span key={i} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 font-mono">{c}</span>))}</div></div>
            )}
            {rm.long_term_vision && <div className="glass rounded-2xl p-6"><div className="overline mb-2">Long-Term Vision</div><p className="text-lg font-heading font-light italic text-zinc-300">{rm.long_term_vision}</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
