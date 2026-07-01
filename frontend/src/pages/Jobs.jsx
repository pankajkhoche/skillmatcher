import React, { useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, MapPin, DollarSign, Briefcase } from "lucide-react";

export default function Jobs() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.post("/jobs/suggest", {}, { timeout: 90000 });
      setJobs(r.data.jobs || []);
      toast.success("Fresh job matches");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed. Add skills or upload a resume first.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Job Matches</div>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight">Roles that fit you.</h1>
          </div>
          <button data-testid="jobs-refresh" onClick={load} disabled={loading} className="brut-btn bg-yellow-300 px-5 py-3 inline-flex items-center gap-2">
            <Sparkles size={16}/> {loading ? "Finding..." : "Find matches"}
          </button>
        </div>

        {jobs.length === 0 && !loading && (
          <div className="brut-card p-10 bg-white text-center">
            <Briefcase size={40} className="mx-auto mb-3"/>
            <p className="font-bold">Click &ldquo;Find matches&rdquo; to see AI-picked jobs based on your skills &amp; resume.</p>
          </div>
        )}

        {loading && <div className="brut-card p-10 bg-white text-center animate-pulse font-display font-black text-xl">Searching the market...</div>}

        <div className="space-y-4">
          {jobs.map((j, i) => (
            <div key={i} className="brut-card p-6 bg-white hover:-translate-y-0.5 hover:brut-shadow-lg transition-all" data-testid={`job-${i}`}>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-black text-2xl">{j.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm">
                    <span className="font-bold">{j.company}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={13}/> {j.location}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={13}/> {j.type}</span>
                    {j.salary_range && <span className="inline-flex items-center gap-1"><DollarSign size={13}/> {j.salary_range}</span>}
                  </div>
                </div>
                <div className="border-2 border-black px-3 py-2 font-display font-black text-2xl" style={{ background: j.match_score >= 80 ? "hsl(152,60%,70%)" : j.match_score >= 60 ? "hsl(54,100%,70%)" : "hsl(0,84%,85%)" }}>
                  {j.match_score}%
                </div>
              </div>
              <p className="text-sm mt-3">{j.match_reason}</p>
              {j.key_requirements?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.key_requirements.map((r,k)=>(<span key={k} className="text-xs px-2 py-0.5 border-2 border-black bg-[hsl(270,60%,90%)] font-bold">{r}</span>))}
                </div>
              )}
              {j.why_you_fit && <p className="text-sm mt-3 p-3 border-2 border-black bg-[hsl(160,51%,88%)]"><b>Why you fit:</b> {j.why_you_fit}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
