import React, { useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Download, Trophy, MessageSquare, Mic, Square } from "lucide-react";

function VoiceRecorder({ onTranscribed, disabled }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, "recording.webm");
          const r = await api.post("/interview/transcribe", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 });
          onTranscribed(r.data.text || "");
          toast.success("Transcribed");
        } catch { toast.error("Transcription failed"); }
        finally { setBusy(false); }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { toast.error("Microphone permission denied"); }
  };
  const stop = () => { mediaRef.current?.stop(); setRecording(false); };

  return (
    <button type="button" disabled={disabled || busy} onClick={recording ? stop : start} data-testid="iv-mic"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${recording ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-cyan-400/30 bg-cyan-500/[0.05] text-cyan-300 hover:bg-cyan-500/10"} disabled:opacity-40`}>
      {busy ? "Transcribing…" : recording ? (<><Square size={14}/> Stop recording</>) : (<><Mic size={14}/> Answer with voice</>)}
    </button>
  );
}

export default function Interview() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const start = async () => {
    if (role.length < 2) return toast.error("Enter a target role");
    setLoading(true); setScorecard(null);
    try {
      const r = await api.post("/interview/start", { role, difficulty }, { timeout: 90000 });
      setInterviewId(r.data.interview_id);
      setQuestions(r.data.questions);
      setAnswers(new Array(r.data.questions.length).fill(""));
      setCurrent(0);
      toast.success("Interview started");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to start"); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    setScoring(true);
    try {
      const r = await api.post("/interview/submit", { interview_id: interviewId, answers }, { timeout: 120000 });
      setScorecard(r.data.scorecard);
      toast.success("Scorecard ready");
    } catch (e) { toast.error(e.response?.data?.detail || "Scoring failed"); }
    finally { setScoring(false); }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const r = await api.post("/interview/scorecard/pdf", { interview_id: interviewId }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = `talentiq_interview.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch { toast.error("PDF failed"); }
    finally { setDownloading(false); }
  };

  const reset = () => { setInterviewId(null); setQuestions([]); setAnswers([]); setScorecard(null); setCurrent(0); };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="overline mb-3">AI Mock Interview</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Practice. Score. <span className="brand-text italic">Improve.</span></h1>
        </div>

        {!questions.length && !scorecard && (
          <div className="glass rounded-2xl p-8">
            <label className="overline block mb-2">Target Role</label>
            <input data-testid="iv-role" value={role} onChange={(e)=>setRole(e.target.value)} placeholder="Software Engineer, PM, Data Scientist…" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 mb-5 focus:border-cyan-400/50 transition-colors placeholder:text-zinc-700"/>
            <label className="overline block mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {["easy","medium","hard"].map((d)=>(
                <button key={d} data-testid={`iv-diff-${d}`} onClick={()=>setDifficulty(d)} className={`border rounded-xl py-2.5 text-sm font-medium capitalize transition-all ${difficulty===d? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300":"border-white/10 text-zinc-400 hover:border-white/20"}`}>{d}</button>
              ))}
            </div>
            <button onClick={start} disabled={loading} data-testid="iv-start" className="w-full brand-bg brand-bg-hover text-white font-medium py-3.5 rounded-xl brand-glow transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? "Generating questions…" : (<><Sparkles size={16}/> Start Interview</>)}
            </button>
          </div>
        )}

        {questions.length > 0 && !scorecard && (
          <div className="glass rounded-2xl p-8 fade-up">
            <div className="flex justify-between items-center mb-6">
              <div className="overline">Question {current+1} of {questions.length}</div>
              <span className="font-mono text-xs text-cyan-300 uppercase">{questions[current]?.type}</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mb-6 overflow-hidden">
              <div className="brand-bg h-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }}/>
            </div>
            <h2 className="font-heading text-2xl font-light mb-6">{questions[current]?.question}</h2>
            <div className="mb-3"><VoiceRecorder disabled={scoring} onTranscribed={(t)=>{ const a=[...answers]; a[current]=((a[current]||"")+" "+t).trim(); setAnswers(a); }}/></div>
            <textarea
              data-testid={`iv-answer-${current}`}
              value={answers[current] || ""}
              onChange={(e)=>{ const a=[...answers]; a[current]=e.target.value; setAnswers(a); }}
              placeholder="Type your answer here…"
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[200px] text-sm focus:border-cyan-400/50 transition-colors placeholder:text-zinc-700 leading-relaxed"
            />
            <div className="flex justify-between mt-5">
              <button disabled={current===0} onClick={()=>setCurrent(c=>c-1)} data-testid="iv-prev" className="border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30">← Previous</button>
              {current < questions.length-1 ? (
                <button onClick={()=>setCurrent(c=>c+1)} data-testid="iv-next" className="brand-bg brand-bg-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-1.5">Next <ArrowRight size={14}/></button>
              ) : (
                <button onClick={submit} disabled={scoring} data-testid="iv-submit" className="brand-bg brand-bg-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium brand-glow inline-flex items-center gap-1.5 disabled:opacity-40">
                  {scoring ? "Scoring…" : (<>Submit <Trophy size={14}/></>)}
                </button>
              )}
            </div>
          </div>
        )}

        {scorecard && (
          <div className="space-y-4 fade-up" data-testid="iv-scorecard">
            <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 brand-bg opacity-5"/>
              <div className="relative">
                <Trophy className="mx-auto mb-4 text-cyan-400" size={40} strokeWidth={1.2}/>
                <div className="font-heading text-7xl font-light brand-text">{scorecard.overall_score}<span className="text-3xl text-zinc-600">/100</span></div>
                <p className="text-lg text-zinc-400 mt-3 italic">{scorecard.verdict}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Communication","communication_score"],["Technical","technical_score"],["Confidence","confidence_score"],["Clarity","clarity_score"]].map(([label,key])=>(
                <div key={key} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5 text-center">
                  <div className="font-heading font-light text-3xl brand-text">{scorecard[key]}</div>
                  <div className="overline mt-1">{label}</div>
                </div>
              ))}
            </div>

            <Panel title="Strengths" items={scorecard.strengths} icon={<Trophy size={16} className="text-emerald-400"/>}/>
            <Panel title="Improvement Areas" items={scorecard.improvement_areas} icon={<MessageSquare size={16} className="text-orange-400"/>} accent/>
            <Panel title="Next Steps" items={scorecard.next_steps} icon={<ArrowRight size={16} className="text-cyan-400"/>}/>

            <div className="flex flex-wrap gap-3">
              <button onClick={download} disabled={downloading} data-testid="iv-download" className="brand-bg brand-bg-hover text-white font-medium px-5 py-3 rounded-xl brand-glow inline-flex items-center gap-2 disabled:opacity-40"><Download size={16}/> {downloading ? "…" : "Download Scorecard PDF"}</button>
              <button onClick={reset} data-testid="iv-restart" className="border border-white/10 hover:border-white/20 px-5 py-3 rounded-xl font-medium">Start new interview</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, items = [], icon, accent }) {
  return (
    <div className={`rounded-2xl border p-6 ${accent ? "border-cyan-400/20 bg-cyan-500/[0.03]" : "border-white/[0.06] bg-[#0A0A12]"}`}>
      <div className="flex items-center gap-2 mb-3">{icon}<h3 className="font-heading text-lg font-medium">{title}</h3><span className="ml-auto font-mono text-xs text-zinc-600">{items?.length || 0}</span></div>
      <ul className="space-y-2 text-sm text-zinc-400">
        {items?.map((it,i)=>(<li key={i} className="flex gap-3"><span className="text-zinc-700 font-mono text-xs mt-0.5">{String(i+1).padStart(2,"0")}</span><span className="leading-relaxed">{it}</span></li>))}
      </ul>
    </div>
  );
}
