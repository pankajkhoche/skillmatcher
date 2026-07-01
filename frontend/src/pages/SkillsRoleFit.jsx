import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, X, Plus } from "lucide-react";

export default function SkillsRoleFit() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState(user?.skills || []);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState(user?.target_role || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setSkills(user?.skills || []);
    setTarget(user?.target_role || "");
  }, [user]);

  const addSkill = () => {
    const v = input.trim();
    if (!v) return;
    if (skills.includes(v)) { setInput(""); return; }
    setSkills([...skills, v]);
    setInput("");
  };

  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s));

  const analyze = async () => {
    if (skills.length === 0) return toast.error("Add at least one skill");
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post("/skills/analyze", { skills, target_role: target || null }, { timeout: 90000 });
      setResult(r.data);
      const me = await api.get("/auth/me");
      updateUser(me.data.user);
      toast.success("Recommendations ready");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 80 ? "text-[#C084FC]" : s >= 60 ? "text-amber-500" : "text-zinc-500";

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10 max-w-3xl">
          <div className="overline mb-3">Skills & role fit</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Which role should you <span className="text-[#C084FC] italic">chase?</span></h1>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8 mb-6">
          <label className="overline block mb-3">Your skills</label>
          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]" data-testid="skills-tags">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#C084FC]/10 text-[#C084FC] border border-purple-400/20 font-mono">
                {s}
                <button onClick={()=>removeSkill(s)} data-testid={`remove-${s}`} className="hover:text-white transition-colors"><X size={12}/></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              data-testid="skills-input"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="e.g. React, Python, SQL…"
              className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-[#C084FC]/50 transition-colors placeholder:text-zinc-700"
            />
            <button onClick={addSkill} data-testid="skills-add" className="border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all px-4 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium"><Plus size={14}/> Add</button>
          </div>

          <label className="overline block mb-2 mt-6">Target role (optional)</label>
          <input data-testid="target-role" value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Software Engineer, Product Manager…" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-[#C084FC]/50 transition-colors placeholder:text-zinc-700"/>

          <button onClick={analyze} disabled={loading} data-testid="skills-analyze" className="w-full brand-bg text-white font-medium py-3.5 rounded-xl mt-6 brand-bg-hover transition-all brand-glow inline-flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? "Analyzing…" : (<><Sparkles size={16} strokeWidth={2}/> Get recommendations</>)}
          </button>
        </div>

        {result && (
          <div className="space-y-10 fade-up" data-testid="skills-result">
            <div>
              <div className="overline mb-4">Top pick</div>
              <div className="rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-500/[0.08] to-transparent p-10">
                <h2 className="font-heading font-light text-5xl tracking-tighter">{result.top_pick}</h2>
              </div>
            </div>

            <div>
              <div className="overline mb-4">Recommended roles</div>
              <div className="grid md:grid-cols-2 gap-4">
                {result.recommended_roles?.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6 card-hover">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-heading text-xl font-medium">{r.role}</h3>
                      <span className={`font-mono font-medium ${scoreColor(r.fit_score)}`}>{r.fit_score}%</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{r.why}</p>
                    {r.skills_matched?.length > 0 && (
                      <div className="mb-3">
                        <div className="overline mb-1.5">You have</div>
                        <div className="flex flex-wrap gap-1">{r.skills_matched.map((s,j)=>(<span key={j} className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">{s}</span>))}</div>
                      </div>
                    )}
                    {r.skills_to_learn?.length > 0 && (
                      <div>
                        <div className="overline mb-1.5">You need</div>
                        <div className="flex flex-wrap gap-1">{r.skills_to_learn.map((s,j)=>(<span key={j} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-400 border border-white/10 font-mono">{s}</span>))}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {result.learning_roadmap?.length > 0 && (
              <div>
                <div className="overline mb-4">Learning roadmap</div>
                <div className="border-l border-white/10 ml-6 space-y-6">
                  {result.learning_roadmap.map((step, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[#0A0A12] border border-[#C084FC]/40 flex items-center justify-center font-mono text-[10px] text-[#C084FC]">{step.step}</div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A12] p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                          <h4 className="font-heading text-lg font-medium">{step.title}</h4>
                          <div className="overline">{step.duration}</div>
                        </div>
                        {step.resources?.length > 0 && (
                          <ul className="text-sm text-zinc-400 space-y-1">
                            {step.resources.map((r,j)=>(<li key={j} className="flex gap-2"><span className="text-zinc-700">→</span>{r}</li>))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
