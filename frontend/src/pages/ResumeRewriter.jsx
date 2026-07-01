import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Download, ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ResumeRewriter() {
  const loc = useLocation();
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Pre-fill from analyze page or from latest resume
    if (loc.state?.resumeText) {
      setResumeText(loc.state.resumeText);
    } else {
      api.get("/resume/latest").then((r) => {
        if (r.data?.resume?.resume_text) setResumeText(r.data.resume.resume_text);
      }).catch(() => {});
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
      toast.success("Rewritten!");
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
      toast.success("Downloaded!");
    } catch (e) {
      toast.error("PDF failed");
    } finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Real-time Resume Rewriter</div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight">One resume. Any job. Perfectly tuned.</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            <div className="brut-card p-5 bg-white">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Job Description</label>
              <textarea
                data-testid="rewriter-jd"
                value={jd}
                onChange={(e)=>setJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full border-2 border-black p-3 min-h-[180px] bg-white text-sm"
              />
            </div>
            <div className="brut-card p-5 bg-white">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Your Resume (text)</label>
              <textarea
                data-testid="rewriter-resume"
                value={resumeText}
                onChange={(e)=>setResumeText(e.target.value)}
                placeholder="Paste your resume here, or upload one on the Analyzer page..."
                className="w-full border-2 border-black p-3 min-h-[220px] bg-white text-sm"
              />
            </div>
            <button onClick={rewrite} disabled={loading} data-testid="rewriter-submit" className="brut-btn bg-yellow-300 w-full py-3 inline-flex items-center justify-center gap-2 text-base">
              {loading ? "Rewriting with Claude..." : (<><Sparkles size={16}/> Rewrite for this job</>)}
            </button>
          </div>

          {/* Right: output */}
          <div>
            {!result && !loading && (
              <div className="brut-card p-8 h-full flex items-center justify-center bg-white text-center">
                <div>
                  <div className="w-16 h-16 bg-[hsl(160,51%,70%)] border-2 border-black brut-shadow-sm mx-auto mb-4 flex items-center justify-center"><ArrowRight/></div>
                  <p className="font-bold">Your rewritten resume will appear here.</p>
                </div>
              </div>
            )}
            {loading && <div className="brut-card p-8 text-center animate-pulse font-display font-black text-2xl">Crafting your rewrite…</div>}
            {result && (
              <div className="space-y-4" data-testid="rewriter-result">
                <div className="brut-card p-5 bg-[hsl(160,51%,70%)]">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold tracking-[0.2em] uppercase">Match Score</div>
                    <div className="font-display font-black">
                      <span className="line-through opacity-50 text-xl mr-2">{result.match_score_before}</span>
                      <span className="text-3xl">{result.match_score_after}</span>
                      <span className="text-sm ml-1">/100</span>
                    </div>
                  </div>
                  {result.keywords_added?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase mb-1">Keywords Added</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords_added.map((k,i)=>(<span key={i} className="text-xs px-2 py-0.5 border-2 border-black bg-white font-bold">{k}</span>))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="brut-card bg-[hsl(54,100%,90%)] p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold tracking-[0.2em] uppercase">Rewritten Resume</div>
                    <button onClick={download} disabled={downloading} data-testid="rewriter-download" className="brut-btn bg-black text-white text-xs px-3 py-1.5 inline-flex items-center gap-1">
                      <Download size={14}/> {downloading ? "..." : "Download PDF"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-white border-2 border-black p-4 max-h-[420px] overflow-auto">{result.rewritten_resume}</pre>
                </div>

                {result.improvements?.length > 0 && (
                  <div className="brut-card p-5 bg-white">
                    <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">What changed</div>
                    <ul className="space-y-1.5 text-sm">
                      {result.improvements.map((it,i)=>(<li key={i} className="flex gap-2"><span className="font-bold">✓</span>{it}</li>))}
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
