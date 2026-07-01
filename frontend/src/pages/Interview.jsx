import React, { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Download, Trophy, MessageSquare, Mic, Square, Video, Eye, Activity, Loader2 } from "lucide-react";
import { startBodyAnalyzer } from "@/lib/bodyAnalyzer";

// Unified webcam + mic recorder. Analyzes body-language via MediaPipe while recording.
function VideoAnswer({ onComplete, disabled }) {
  const videoRef = useRef(null);
  const mediaRef = useRef(null);
  const streamRef = useRef(null);
  const analyzerRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState({ eye: 0, posture: 0 });

  const initCamera = async () => {
    if (streamRef.current) return true;
    setInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const analyzer = await startBodyAnalyzer(videoRef.current);
      analyzerRef.current = analyzer;
      setReady(true);
      return true;
    } catch (e) {
      toast.error("Camera/mic permission denied");
      return false;
    } finally { setInitializing(false); }
  };

  // live meter refresh
  useEffect(() => {
    let raf;
    const tick = () => {
      if (analyzerRef.current?.live) {
        setLive({
          eye: Math.round((analyzerRef.current.live.eye || 0) * 100),
          posture: Math.round((analyzerRef.current.live.posture || 0) * 100),
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // cleanup on unmount
  useEffect(() => () => {
    try { analyzerRef.current?.stop(); } catch (e) { /* noop */ }
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) { /* noop */ }
  }, []);

  const start = async () => {
    const ok = await initCamera();
    if (!ok) return;
    analyzerRef.current?.reset();
    chunksRef.current = [];
    startRef.current = Date.now();

    // Record audio only (webm/opus) for Whisper
    const audioStream = new MediaStream(streamRef.current.getAudioTracks());
    const mr = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.onstop = async () => {
      const dur = (Date.now() - startRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", blob, "recording.webm");
        const r = await api.post("/interview/transcribe", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 });
        const snap = analyzerRef.current?.snapshot() || { eye_contact_pct: 0, posture_score: 0 };
        onComplete({
          text: r.data.text || "",
          duration_sec: dur,
          eye_contact_pct: snap.eye_contact_pct,
          posture_score: snap.posture_score,
        });
        toast.success("Answer captured");
      } catch (e) {
        toast.error("Transcription failed");
      } finally { setBusy(false); }
    };
    mediaRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stop = () => { mediaRef.current?.stop(); setRecording(false); };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/40 overflow-hidden">
      <div className="relative aspect-video bg-black">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" data-testid="iv-video" />
        {!ready && !initializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 bg-black/70">
            <Video size={32} className="text-cyan-400"/>
            <div className="text-sm text-zinc-400 max-w-xs">Enable your camera and microphone to start the video interview. Nothing leaves your browser except the audio transcript.</div>
            <button onClick={initCamera} data-testid="iv-enable-cam" className="brand-bg brand-bg-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2">
              <Video size={14}/> Enable camera & mic
            </button>
          </div>
        )}
        {initializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
            <Loader2 className="animate-spin text-cyan-400" size={26}/>
            <div className="text-xs text-zinc-500 font-mono">Loading body-language models…</div>
          </div>
        )}
        {ready && (
          <>
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className={`px-2.5 py-1 rounded-md font-mono ${recording ? "bg-red-500/80 text-white animate-pulse" : "bg-black/60 text-zinc-300 border border-white/10"}`}>
                {recording ? "● REC" : "READY"}
              </span>
              <div className="flex gap-2">
                <Meter icon={<Eye size={11}/>} label="Eye" value={live.eye} testid="iv-live-eye"/>
                <Meter icon={<Activity size={11}/>} label="Posture" value={live.posture} testid="iv-live-posture"/>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4 flex justify-between items-center">
        <div className="text-xs text-zinc-500 font-mono">
          {recording ? "Speak clearly. Look at the camera." : ready ? "Press record when ready." : "Camera not enabled."}
        </div>
        <button type="button" disabled={disabled || busy} onClick={recording ? stop : start} data-testid="iv-record"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${recording ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-cyan-400/30 bg-cyan-500/[0.05] text-cyan-300 hover:bg-cyan-500/10"} disabled:opacity-40`}>
          {busy ? (<><Loader2 size={14} className="animate-spin"/> Transcribing…</>) : recording ? (<><Square size={14}/> Stop</>) : (<><Mic size={14}/> Record answer</>)}
        </button>
      </div>
    </div>
  );
}

function Meter({ icon, label, value, testid }) {
  const color = value >= 70 ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" : value >= 40 ? "text-amber-300 border-amber-400/40 bg-amber-500/10" : "text-red-300 border-red-400/40 bg-red-500/10";
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[10px] ${color}`}>
      {icon}{label} {value}%
    </span>
  );
}

export default function Interview() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [durations, setDurations] = useState([]);
  const [bodyLang, setBodyLang] = useState([]); // per-question { eye_contact_pct, posture_score }
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
      const n = r.data.questions.length;
      setAnswers(new Array(n).fill(""));
      setDurations(new Array(n).fill(0));
      setBodyLang(new Array(n).fill(null));
      setCurrent(0);
      toast.success("Interview started");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to start"); }
    finally { setLoading(false); }
  };

  const handleAnswerComplete = ({ text, duration_sec, eye_contact_pct, posture_score }) => {
    const a = [...answers]; a[current] = ((a[current] || "") + " " + text).trim(); setAnswers(a);
    const d = [...durations]; d[current] = (d[current] || 0) + duration_sec; setDurations(d);
    // For each question, keep the latest capture's body-language snapshot.
    const b = [...bodyLang]; b[current] = { eye_contact_pct, posture_score }; setBodyLang(b);
  };

  const submit = async () => {
    setScoring(true);
    try {
      const r = await api.post("/interview/submit", {
        interview_id: interviewId,
        answers,
        durations_sec: durations,
        body_language: bodyLang,
      }, { timeout: 120000 });
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

  const reset = () => { setInterviewId(null); setQuestions([]); setAnswers([]); setDurations([]); setBodyLang([]); setScorecard(null); setCurrent(0); };

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="overline mb-3">AI Video Mock Interview</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Face the camera. <span className="brand-text italic">Show up.</span></h1>
          <p className="text-sm text-zinc-500 mt-3 max-w-xl">On-device body-language coaching. Your camera stays in the browser — only the audio transcript is sent for scoring.</p>
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
              {loading ? "Generating questions…" : (<><Sparkles size={16}/> Start video interview</>)}
            </button>
          </div>
        )}

        {questions.length > 0 && !scorecard && (
          <div className="space-y-4 fade-up">
            <VideoAnswer key={current} disabled={scoring} onComplete={handleAnswerComplete}/>
            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="overline">Question {current+1} of {questions.length}</div>
                <span className="font-mono text-xs text-cyan-300 uppercase">{questions[current]?.type}</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mb-5 overflow-hidden">
                <div className="brand-bg h-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }}/>
              </div>
              <h2 className="font-heading text-xl font-light mb-4">{questions[current]?.question}</h2>
              {answers[current] && (
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Transcribed answer</div>
              )}
              <textarea
                data-testid={`iv-answer-${current}`}
                value={answers[current] || ""}
                onChange={(e)=>{ const a=[...answers]; a[current]=e.target.value; setAnswers(a); }}
                placeholder="Your transcript will appear here. You can edit it before moving on."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[120px] text-sm focus:border-cyan-400/50 transition-colors placeholder:text-zinc-700 leading-relaxed"
              />
              {bodyLang[current] && (
                <div className="flex gap-3 mt-3 text-xs font-mono text-zinc-500" data-testid={`iv-bl-${current}`}>
                  <span>Eye contact: <span className="text-cyan-300">{bodyLang[current].eye_contact_pct}%</span></span>
                  <span>Posture: <span className="text-cyan-300">{bodyLang[current].posture_score}%</span></span>
                </div>
              )}
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

            {scorecard.body_language && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.03] p-6" data-testid="iv-body-language">
                <div className="flex items-center gap-2 mb-4"><Video size={16} className="text-cyan-400"/><h3 className="font-heading text-lg font-medium">Body Language</h3><span className="ml-auto font-mono text-xs text-zinc-600">on-device</span></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <Stat label="Eye Contact" val={`${scorecard.body_language.avg_eye_contact_pct}%`} score={scorecard.body_language.avg_eye_contact_pct}/>
                  <Stat label="Posture" val={`${scorecard.body_language.avg_posture_score}%`} score={scorecard.body_language.avg_posture_score}/>
                  <Stat label="Presence" val={scorecard.body_language.presence_score} score={scorecard.body_language.presence_score}/>
                  <Stat label="Frames" val={scorecard.body_language.captured_answers}/>
                </div>
                <p className="text-sm text-zinc-300 italic">{scorecard.body_language.verdict}</p>
              </div>
            )}

            <Panel title="Strengths" items={scorecard.strengths} icon={<Trophy size={16} className="text-emerald-400"/>}/>
            {scorecard.speaking_assessment && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.03] p-6" data-testid="iv-speaking">
                <div className="flex items-center gap-2 mb-4"><Mic size={16} className="text-cyan-400"/><h3 className="font-heading text-lg font-medium">Speaking Assessment</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <Stat label="Pace" val={`${scorecard.speaking_assessment.avg_wpm} wpm`} score={scorecard.speaking_assessment.pace_score}/>
                  <Stat label="Clarity" val={`${scorecard.speaking_assessment.filler_ratio_pct}% fillers`} score={scorecard.speaking_assessment.clarity_score}/>
                  <Stat label="Words" val={scorecard.speaking_assessment.total_words}/>
                  <Stat label="Fillers" val={scorecard.speaking_assessment.total_fillers}/>
                </div>
                <p className="text-sm text-zinc-300 italic">{scorecard.speaking_assessment.verdict}</p>
              </div>
            )}
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

function Stat({ label, val, score }) {
  const cls = score == null ? "text-white" : score >= 80 ? "brand-text" : score >= 50 ? "text-amber-300" : "text-red-400";
  return (
    <div className="rounded-xl border border-white/10 p-3 text-center">
      <div className={`font-heading font-light text-2xl ${cls}`}>{val}</div>
      <div className="overline mt-1">{label}</div>
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
