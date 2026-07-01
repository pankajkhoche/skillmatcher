import React, { useRef, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Upload, CheckCircle2, XCircle, Sparkles, FileText } from "lucide-react";
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
      const r = await api.post("/resume/analyze", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 });
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
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Resume Analyzer</div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight">See what recruiters see.</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload area */}
          <div>
            <div
              onDragOver={(e)=>e.preventDefault()}
              onDrop={onDrop}
              onClick={()=>inputRef.current?.click()}
              data-testid="resume-dropzone"
              className="brut-card p-10 border-dashed border-4 cursor-pointer hover:bg-yellow-100 text-center min-h-[280px] flex flex-col justify-center items-center"
            >
              <Upload size={40} className="mb-3"/>
              <div className="font-display font-black text-xl mb-1">{file ? file.name : "Drop your resume here"}</div>
              <div className="text-sm">PDF or DOCX · max 10MB</div>
              <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e)=>setFile(e.target.files?.[0])} data-testid="resume-file-input"/>
            </div>
            <button onClick={handleUpload} disabled={loading || !file} data-testid="resume-analyze-btn" className="brut-btn bg-yellow-300 w-full mt-4 py-3 text-base inline-flex items-center justify-center gap-2">
              {loading ? "Analyzing with Claude..." : (<><Sparkles size={16}/> Analyze Resume</>)}
            </button>
            {result && (
              <Link to="/rewriter" state={{ resumeText: result.resume_text }} data-testid="go-rewrite" className="brut-btn bg-[hsl(270,60%,82%)] w-full mt-3 py-3 text-base flex items-center justify-center gap-2">
                <FileText size={16}/> Rewrite this for a job →
              </Link>
            )}
          </div>

          {/* Results */}
          <div>
            {!result && !loading && (
              <div className="brut-card p-8 h-full flex items-center justify-center text-center bg-white">
                <div>
                  <div className="w-16 h-16 bg-yellow-300 border-2 border-black brut-shadow-sm mx-auto mb-4 flex items-center justify-center"><Sparkles /></div>
                  <p className="font-bold">Your results will appear here.</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="brut-card p-8 h-full flex items-center justify-center text-center bg-white">
                <div className="animate-pulse font-display font-black text-2xl">Reading your resume…</div>
              </div>
            )}
            {result && (
              <div className="space-y-4" data-testid="resume-result">
                <div className="brut-card p-6 flex flex-col items-center bg-white">
                  <ScoreDial score={result.analysis.ats_score} />
                  <p className="text-sm mt-4 text-center max-w-md">{result.analysis.one_line_summary}</p>
                  {result.analysis.score_breakdown && (
                    <div className="grid grid-cols-5 gap-2 mt-4 w-full">
                      {Object.entries(result.analysis.score_breakdown).map(([k,v])=>(
                        <div key={k} className="border-2 border-black p-2 text-center">
                          <div className="font-display font-black text-lg">{v}</div>
                          <div className="text-[9px] uppercase tracking-wider font-bold">{k}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Section title="Pros" color="hsl(160, 51%, 70%)" icon={<CheckCircle2 size={16}/>} items={result.analysis.pros} testid="pros"/>
                <Section title="Cons" color="hsl(0, 84%, 85%)" icon={<XCircle size={16}/>} items={result.analysis.cons} testid="cons"/>
                <Section title="Suggested changes" color="hsl(54, 100%, 75%)" icon={<Sparkles size={16}/>} items={result.analysis.suggested_changes} testid="suggestions"/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, icon, items = [], testid }) {
  return (
    <div className="brut-card p-5" style={{ background: color }} data-testid={`section-${testid}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-display font-black text-lg">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {items?.map((it, i) => <li key={i} className="flex gap-2"><span className="font-bold">→</span><span>{it}</span></li>)}
      </ul>
    </div>
  );
}
