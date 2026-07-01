import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Download, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ResumeRewriter() {
  const loc = useLocation();
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (loc.state?.resumeText) {
      setResumeText(loc.state.resumeText);
    } else {
      api.get("/resume/latest").then((r) => {
        if (r.data?.resume?.resume_text) setResumeText(r.data.resume.resume_text);
      }).catch((e) => console.warn("latest resume load failed", e?.response?.status));
    }
  }, [loc.state]);

  const rewrite = async () => {
    if (resumeText.length < 30) return toast.error("Paste or upload a resume first");
    if (jd.length < 20) return toast.error("Paste the job description");
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post("/resume/rewrite", { resume_text: resumeText, job_description: jd }, { timeout: 120000 });
      setResult(r.data);
      toast.success("Rewritten");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Rewrite failed");
    } finally { setLoading(false); }
  };

  const download = async () => {
    if (!result?.rewritten_resume) return;
    setDownloading(true);
    try {
      const r = await api.post("/resume/rewrite/pdf", { text: result.rewritten_resume }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "talentiq_resume.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) {
      toast.error("PDF failed");
    } finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10 max-w-3xl">
          <div className="overline mb-3">Real-time rewriter</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">One resume. Any job. <span className="text-[#22D3EE] italic">Perfectly tuned.</span></h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
              <label className="overline block mb-3">Job description</label>
              <textarea
                data-testid="rewriter-jd"
                value={jd}
                onChange={(e)=>setJd(e.target.value)}
                placeholder="Paste the target job description here..."
                className="w-full bg-transparent border border-white/10 rounded-xl p-4 min-h-[200px] text-sm focus:border-[#22D3EE]/50 transition-colors placeholder:text-zinc-700 leading-relaxed"
              />
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
              <label className="overline block mb-3">Your resume</label>
              <textarea
                data-testid="rewriter-resume"
                value={resumeText}
                onChange={(e)=>setResumeText(e.target.value)}
                placeholder="Paste your resume text, or upload one on the Analyzer page..."
                className="w-full bg-transparent border border-white/10 rounded-xl p-4 min-h-[240px] text-sm focus:border-[#22D3EE]/50 transition-colors placeholder:text-zinc-700 leading-relaxed"
              />
            </div>
            <button onClick={rewrite} disabled={loading} data-testid="rewriter-submit" className="w-full brand-bg text-white font-medium py-3.5 rounded-xl brand-bg-hover transition-all brand-glow inline-flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? "Rewriting…" : (<><Sparkles size={16} strokeWidth={2}/> Rewrite for this job</>)}
            </button>
          </div>

          <div>
            {!result && !loading && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto mb-4 flex items-center justify-center">
                    <ArrowRight size={22} className="text-zinc-500" strokeWidth={1.5}/>
                  </div>
                  <p className="text-zinc-500">Your rewritten resume will appear here.</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 text-center animate-pulse">
                <div className="font-heading text-2xl font-light text-zinc-400">Crafting your rewrite…</div>
                <div className="overline mt-3">Claude Sonnet 4.5</div>
              </div>
            )}
            {result && (
              <div className="space-y-4 fade-up" data-testid="rewriter-result">
                <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-6">
                  <div className="overline mb-3">Match score</div>
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="font-heading text-2xl text-zinc-600 line-through">{result.match_score_before}</span>
                    <ArrowRight size={16} className="text-zinc-500"/>
                    <span className="font-heading text-5xl font-light text-[#22D3EE]">{result.match_score_after}</span>
                    <span className="font-mono text-sm text-zinc-500">/100</span>
                  </div>
                  {result.keywords_added?.length > 0 && (
                    <div>
                      <div className="overline mb-2">Keywords added</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords_added.map((k)=>(<span key={k} className="text-xs px-2.5 py-1 rounded-md bg-[#22D3EE]/10 text-[#22D3EE] border border-cyan-400/20 font-mono">{k}</span>))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="overline">Rewritten resume</div>
                    <button onClick={download} disabled={downloading} data-testid="rewriter-download" className="bg-white/[0.03] border border-white/10 hover:border-[#22D3EE]/40 hover:text-[#22D3EE] text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5">
                      <Download size={12} strokeWidth={1.5}/> {downloading ? "..." : "Download PDF"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-300 bg-black/40 border border-white/[0.06] rounded-xl p-5 max-h-[460px] overflow-auto leading-relaxed">{result.rewritten_resume}</pre>
                </div>

                {result.improvements?.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-6">
                    <div className="overline mb-3">What changed</div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      {result.improvements.map((it,i)=>(
                        <li key={`${i}-${it.slice(0, 20)}`} className="flex gap-3">
                          <span className="text-[#22D3EE] font-mono text-xs mt-0.5">{String(i+1).padStart(2,"0")}</span>
                          <span className="leading-relaxed">{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
