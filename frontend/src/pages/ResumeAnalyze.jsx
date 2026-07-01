import React, { useRef, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Upload, CheckCircle2, XCircle, Sparkles, ArrowUpRight, FileText } from "lucide-react";
import ScoreDial from "@/components/ScoreDial";
import { Link } from "react-router-dom";

export default function ResumeAnalyze() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a resume file");
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api.post("/resume/analyze", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      setResult(r.data);
      toast.success("Analysis complete");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Analysis failed");
    } finally { setLoading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="overline mb-3">Resume Analyzer</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">See what recruiters see.</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div
              onDragOver={(e)=>e.preventDefault()}
              onDrop={onDrop}
              onClick={()=>inputRef.current?.click()}
              data-testid="resume-dropzone"
              className="bg-[#0A0A12] border border-dashed border-white/15 rounded-2xl p-12 cursor-pointer hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/[0.02] transition-all text-center min-h-[320px] flex flex-col justify-center items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-5">
                <Upload size={22} className="text-zinc-400" strokeWidth={1.5}/>
              </div>
              <div className="font-heading text-2xl font-light mb-2">{file ? file.name : "Drop your resume"}</div>
              <div className="text-sm text-zinc-500">PDF or DOCX · max 10MB</div>
              <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e)=>setFile(e.target.files?.[0])} data-testid="resume-file-input"/>
            </div>
            <button onClick={handleUpload} disabled={loading || !file} data-testid="resume-analyze-btn" className="w-full mt-4 brand-bg text-white font-medium py-3.5 rounded-xl brand-bg-hover transition-all brand-glow disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {loading ? "Analyzing with Claude…" : (<><Sparkles size={16} strokeWidth={2}/> Analyze resume</>)}
            </button>
            {result && (
              <Link to="/rewriter" state={{ resumeText: result.resume_text }} data-testid="go-rewrite" className="w-full mt-3 border border-white/10 hover:border-[#22D3EE]/30 hover:bg-white/[0.02] transition-all font-medium py-3.5 rounded-xl flex items-center justify-center gap-2">
                <FileText size={16} strokeWidth={1.5}/> Rewrite this for a job <ArrowUpRight size={14}/>
              </Link>
            )}
          </div>

          <div>
            {!result && !loading && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto mb-4 flex items-center justify-center">
                    <Sparkles size={22} className="text-zinc-500" strokeWidth={1.5}/>
                  </div>
                  <p className="text-zinc-500">Your analysis will appear here.</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 h-full flex items-center justify-center text-center">
                <div className="animate-pulse">
                  <div className="font-heading text-2xl font-light text-zinc-400">Reading your resume…</div>
                  <div className="overline mt-3">Claude Sonnet 4.5</div>
                </div>
              </div>
            )}
            {result && (
              <div className="space-y-4 fade-up" data-testid="resume-result">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8 flex flex-col items-center">
                  <ScoreDial score={result.analysis.ats_score} />
                  <p className="text-sm text-zinc-400 mt-6 text-center max-w-md italic">{result.analysis.one_line_summary}</p>
                  {result.analysis.score_breakdown && (
                    <div className="grid grid-cols-5 gap-2 mt-6 w-full">
                      {Object.entries(result.analysis.score_breakdown).map(([k,v])=>(
                        <div key={k} className="rounded-lg border border-white/[0.06] p-3 text-center">
                          <div className="font-mono text-lg text-[#22D3EE]">{v}</div>
                          <div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1">{k}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Section title="Strengths" icon={<CheckCircle2 size={16} className="text-emerald-400" strokeWidth={1.5}/>} items={result.analysis.pros} testid="pros" />
                <Section title="Weaknesses" icon={<XCircle size={16} className="text-red-400" strokeWidth={1.5}/>} items={result.analysis.cons} testid="cons" />
                <Section title="Suggested improvements" icon={<Sparkles size={16} className="text-[#22D3EE]" strokeWidth={1.5}/>} items={result.analysis.suggested_changes} testid="suggestions" featured />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, items = [], testid, featured }) {
  return (
    <div className={`rounded-2xl border p-6 ${featured ? "border-cyan-400/20 bg-[#22D3EE]/[0.03]" : "border-white/[0.06] bg-[#0A0A12]"}`} data-testid={`section-${testid}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-heading text-lg font-medium">{title}</h3>
        <span className="ml-auto font-mono text-xs text-zinc-600">{items?.length || 0}</span>
      </div>
      <ul className="space-y-2.5 text-sm text-zinc-400">
        {items?.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-zinc-700 font-mono text-xs mt-0.5">{String(i+1).padStart(2,"0")}</span>
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
