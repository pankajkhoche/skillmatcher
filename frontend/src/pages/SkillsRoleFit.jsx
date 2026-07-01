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
      // refresh user
      const me = await api.get("/auth/me");
      updateUser(me.data.user);
      toast.success("Recommendations ready");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Skills & Role Fit</div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight">Which role should you chase?</h1>
        </div>

        <div className="brut-card p-6 bg-white mb-6">
          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Your Skills</label>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]" data-testid="skills-tags">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 border-2 border-black bg-[hsl(270,60%,82%)] px-3 py-1 font-bold text-sm">
                {s}
                <button onClick={()=>removeSkill(s)} data-testid={`remove-${s}`} className="hover:text-red-600"><X size={14}/></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              data-testid="skills-input"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="e.g. React, Python, SQL..."
              className="flex-1 border-2 border-black px-4 py-2.5 bg-white"
            />
            <button onClick={addSkill} data-testid="skills-add" className="brut-btn bg-yellow-300 px-4 inline-flex items-center gap-1"><Plus size={16}/> Add</button>
          </div>

          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2 mt-5">Target Role (optional)</label>
          <input data-testid="target-role" value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="e.g. Software Engineer, Product Manager" className="w-full border-2 border-black px-4 py-2.5 bg-white" />

          <button onClick={analyze} disabled={loading} data-testid="skills-analyze" className="brut-btn bg-yellow-300 w-full mt-5 py-3 inline-flex items-center justify-center gap-2">
            {loading ? "Analyzing…" : (<><Sparkles size={16}/> Get role recommendations</>)}
          </button>
        </div>

        {result && (
          <div className="space-y-8" data-testid="skills-result">
            <div>
              <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3">Top Pick</div>
              <div className="brut-card p-6 bg-[hsl(54,100%,50%)]">
                <h2 className="font-display font-black text-3xl tracking-tight">{result.top_pick}</h2>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3">Recommended Roles</div>
              <div className="grid md:grid-cols-2 gap-4">
                {result.recommended_roles?.map((r, i) => (
                  <div key={i} className="brut-card p-5 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display font-black text-xl">{r.role}</h3>
                      <span className="border-2 border-black px-2 py-0.5 font-bold text-sm" style={{ background: r.fit_score >= 80 ? "hsl(152,60%,70%)" : r.fit_score >= 60 ? "hsl(54,100%,70%)" : "hsl(0,84%,85%)" }}>{r.fit_score}%</span>
                    </div>
                    <p className="text-sm mb-3">{r.why}</p>
                    {r.skills_matched?.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[10px] uppercase font-bold tracking-wider mb-1">You have</div>
                        <div className="flex flex-wrap gap-1">{r.skills_matched.map((s,j)=>(<span key={j} className="text-xs px-2 py-0.5 border-2 border-black bg-[hsl(160,51%,70%)] font-bold">{s}</span>))}</div>
                      </div>
                    )}
                    {r.skills_to_learn?.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider mb-1">You need</div>
                        <div className="flex flex-wrap gap-1">{r.skills_to_learn.map((s,j)=>(<span key={j} className="text-xs px-2 py-0.5 border-2 border-black bg-white font-bold">{s}</span>))}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {result.learning_roadmap?.length > 0 && (
              <div>
                <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3">Learning Roadmap</div>
                <div className="space-y-3">
                  {result.learning_roadmap.map((step, i) => (
                    <div key={i} className="brut-card p-5 bg-white flex gap-4">
                      <div className="w-12 h-12 shrink-0 bg-yellow-300 border-2 border-black flex items-center justify-center font-display font-black text-2xl">{step.step}</div>
                      <div>
                        <h4 className="font-display font-black text-lg">{step.title}</h4>
                        <div className="text-xs uppercase font-bold tracking-wider mb-2">{step.duration}</div>
                        {step.resources?.length > 0 && <ul className="text-sm list-disc list-inside">{step.resources.map((r,j)=>(<li key={j}>{r}</li>))}</ul>}
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
