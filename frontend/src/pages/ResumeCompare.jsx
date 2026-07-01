import React, { useRef, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { GitCompare, Upload, Trophy, CheckCircle2, XCircle, Sparkles } from "lucide-react";

export default function ResumeCompare() {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const refA = useRef(null); const refB = useRef(null);

  const compare = async () => {
    if (!a || !b) return toast.error("Upload both resumes");
    setLoading(true); setResult(null);
    try {
      const fd = new FormData(); fd.append("resume_a", a); fd.append("resume_b", b);
      const r = await api.post("/resume/compare", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      setResult(r.data);
      toast.success("Comparison ready");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const Drop = ({ file, setFile, refEl, label, tid }) => (
    <div onClick={()=>refEl.current?.click()} data-testid={`compare-drop-${tid}`}
      className="bg-[#0A0A12] border border-dashed border-white/15 rounded-2xl p-8 cursor-pointer hover:border-cyan-400/40 hover:bg-cyan-500/[0.02] transition-all text-center min-h-[180px] flex flex-col justify-center items-center">
      <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3"><Upload size={18} className="text-zinc-400"/></div>
      <div className="overline mb-1">{label}</div>
      <div className="font-heading text-lg font-light">{file ? file.name : "Drop resume"}</div>
      <input ref={refEl} type="file" accept=".pdf,.docx" hidden onChange={(e)=>setFile(e.target.files?.[0])} data-testid={`compare-file-${tid}`}/>
    </div>
  );

  const winnerCls = (w, x) => w === x ? "brand-text" : "text-zinc-400";

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="overline mb-3">Resume Compare</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Two resumes. <span className="brand-text italic">One winner.</span></h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Drop file={a} setFile={setA} refEl={refA} label="Resume A" tid="a"/>
          <Drop file={b} setFile={setB} refEl={refB} label="Resume B" tid="b"/>
        </div>
        <button onClick={compare} disabled={loading || !a || !b} data-testid="compare-btn" className="w-full brand-bg brand-bg-hover text-white font-medium py-3.5 rounded-xl brand-glow inline-flex items-center justify-center gap-2 disabled:opacity-40">
          {loading ? "Comparing…" : (<><GitCompare size={16}/> Compare resumes</>)}
        </button>

        {result?.comparison && (
          <div className="mt-6 space-y-4 fade-up" data-testid="compare-result">
            <div className="glass rounded-2xl p-8 text-center">
              <Trophy className="mx-auto mb-3 text-cyan-400" size={32} strokeWidth={1.2}/>
              <div className="font-heading text-2xl font-light mb-4">Winner: <span className="brand-text italic">Resume {result.comparison.winner}</span></div>
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div><div className={`font-heading text-5xl font-light ${winnerCls(result.comparison.winner, "A")}`}>{result.comparison.resume_a_score}</div><div className="overline mt-1">Resume A</div></div>
                <div><div className={`font-heading text-5xl font-light ${winnerCls(result.comparison.winner, "B")}`}>{result.comparison.resume_b_score}</div><div className="overline mt-1">Resume B</div></div>
              </div>
              <p className="text-zinc-400 italic mt-4">{result.comparison.verdict}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {["A","B"].map(k => (
                <div key={k} className={`rounded-2xl border p-6 ${result.comparison.winner===k? "border-cyan-400/25 bg-cyan-500/[0.03]":"border-white/[0.06] bg-[#0A0A12]"}`}>
                  <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={14} className="text-emerald-400"/><h3 className="font-heading text-lg">Resume {k} — Strengths</h3></div>
                  <ul className="space-y-1.5 text-sm text-zinc-400 mb-4">{result.comparison[`resume_${k.toLowerCase()}_strengths`]?.map((s,i)=>(<li key={i}>+ {s}</li>))}</ul>
                  <div className="flex items-center gap-2 mb-3"><XCircle size={14} className="text-red-400"/><h3 className="font-heading text-lg">Weaknesses</h3></div>
                  <ul className="space-y-1.5 text-sm text-zinc-400">{result.comparison[`resume_${k.toLowerCase()}_weaknesses`]?.map((s,i)=>(<li key={i}>− {s}</li>))}</ul>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3"><Sparkles size={14} className="text-cyan-400"/><h3 className="font-heading text-lg">Recommendation</h3></div>
              <p className="text-sm text-zinc-300 mb-4 leading-relaxed">{result.comparison.recommendation}</p>
              {result.comparison.best_of_both?.length > 0 && (
                <>
                  <div className="overline mb-2">Best of Both Worlds</div>
                  <ul className="space-y-1.5 text-sm text-zinc-400">{result.comparison.best_of_both.map((b,i)=>(<li key={i}>★ {b}</li>))}</ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
