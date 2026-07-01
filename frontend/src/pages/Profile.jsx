import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Linkedin, Sparkles, Check, X, Plus } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [targetRole, setTargetRole] = useState(user?.target_role || "");
  const [saving, setSaving] = useState(false);

  // LinkedIn import state
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || "");
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [extracted, setExtracted] = useState(null); // { name, headline, target_role, skills, experience_summary }
  const [pickName, setPickName] = useState(true);
  const [pickHeadline, setPickHeadline] = useState(false);
  const [pickTargetRole, setPickTargetRole] = useState(true);
  const [pickedSkills, setPickedSkills] = useState({}); // skill -> bool

  useEffect(() => {
    setName(user?.name || "");
    setTargetRole(user?.target_role || "");
    setLinkedinUrl(user?.linkedin_url || "");
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/profile", { name, target_role: targetRole, linkedin_url: linkedinUrl });
      updateUser(r.data.user);
      toast.success("Saved");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const parseLinkedIn = async () => {
    if (!linkedinUrl && rawText.trim().length < 40) {
      toast.error("Paste your LinkedIn profile text or enter a URL");
      return;
    }
    setParsing(true); setExtracted(null);
    try {
      const r = await api.post("/profile/linkedin-parse", { linkedin_url: linkedinUrl, raw_text: rawText });
      setExtracted(r.data);
      // default: pre-select every skill
      const skillMap = {};
      (r.data.skills || []).forEach((s) => { skillMap[s] = true; });
      setPickedSkills(skillMap);
      setPickName(!!(r.data.name && !user?.name));
      setPickTargetRole(!!(r.data.target_role && !user?.target_role));
      toast.success("Extracted — review and apply");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not parse. Paste more text.");
    } finally { setParsing(false); }
  };

  const applyMerge = async () => {
    if (!extracted) return;
    setApplying(true);
    try {
      const chosen = Object.entries(pickedSkills).filter(([, v]) => v).map(([k]) => k);
      const r = await api.post("/profile/linkedin-apply", {
        linkedin_url: linkedinUrl,
        name: pickName ? extracted.name : null,
        target_role: pickTargetRole ? extracted.target_role : null,
        headline: pickHeadline ? extracted.headline : null,
        skills: chosen,
      });
      updateUser(r.data.user);
      toast.success(`Applied · +${r.data.added_skills} new skills`);
      setExtracted(null); setRawText("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Apply failed");
    } finally { setApplying(false); }
  };

  const initials = (user?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#FB7185] flex items-center justify-center font-heading font-medium text-2xl text-black" data-testid="profile-avatar">{initials}</div>
            <div>
              <h1 className="font-heading text-3xl font-light tracking-tight">{user?.name}</h1>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              <div className="overline mt-2">{user?.role === "job_seeker" ? "Professional" : "Student"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8 mb-4">
          <div className="overline mb-6">Details</div>
          <label className="overline block mb-2">Full name</label>
          <input data-testid="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 mb-5 focus:border-[#22D3EE]/50 transition-colors" />
          <label className="overline block mb-2">Target role</label>
          <input data-testid="profile-target-role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Software Engineer" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 mb-5 focus:border-[#22D3EE]/50 transition-colors placeholder:text-zinc-700" />
          <label className="overline block mb-2">LinkedIn URL</label>
          <input data-testid="profile-linkedin-url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/yourname" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-[#22D3EE]/50 transition-colors placeholder:text-zinc-700" />
          <button onClick={save} disabled={saving} data-testid="profile-save" className="brand-bg text-white font-medium px-6 py-2.5 mt-6 rounded-xl brand-bg-hover transition-all brand-glow disabled:opacity-40">{saving ? "Saving…" : "Save changes"}</button>
        </div>

        {/* LinkedIn import */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8 mb-4" data-testid="linkedin-import-card">
          <div className="flex items-center gap-2 mb-2">
            <Linkedin size={16} className="text-cyan-400" />
            <div className="overline">Import from LinkedIn</div>
          </div>
          <p className="text-xs text-zinc-500 mb-5 leading-relaxed max-w-xl">
            Save your LinkedIn URL above, then paste your profile text below (About + Experience + Skills sections). Our AI will extract structured fields you can review and merge — nothing is scraped from LinkedIn.
          </p>
          <textarea
            data-testid="linkedin-raw-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste content from your LinkedIn 'About', 'Experience' and 'Skills' sections…"
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[140px] text-sm focus:border-cyan-400/50 transition-colors placeholder:text-zinc-700 leading-relaxed"
          />
          <button onClick={parseLinkedIn} disabled={parsing} data-testid="linkedin-parse" className="mt-4 brand-bg brand-bg-hover text-white font-medium px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-40">
            <Sparkles size={14} /> {parsing ? "Extracting…" : "Extract profile with AI"}
          </button>

          {extracted && (
            <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5" data-testid="linkedin-review">
              <div className="overline mb-4">Review & merge</div>

              {extracted.name && (
                <ReviewRow
                  label="Name"
                  value={extracted.name}
                  checked={pickName}
                  onToggle={() => setPickName((v) => !v)}
                  testid="review-name"
                />
              )}
              {extracted.headline && (
                <ReviewRow
                  label="Headline"
                  value={extracted.headline}
                  checked={pickHeadline}
                  onToggle={() => setPickHeadline((v) => !v)}
                  testid="review-headline"
                  hint="Adds to your profile as target headline"
                />
              )}
              {extracted.target_role && (
                <ReviewRow
                  label="Target role"
                  value={extracted.target_role}
                  checked={pickTargetRole}
                  onToggle={() => setPickTargetRole((v) => !v)}
                  testid="review-target-role"
                />
              )}

              {extracted.skills?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Skills · click to toggle</div>
                  <div className="flex flex-wrap gap-1.5" data-testid="review-skills">
                    {extracted.skills.map((s) => {
                      const on = !!pickedSkills[s];
                      return (
                        <button
                          key={s}
                          data-testid={`review-skill-${s}`}
                          onClick={() => setPickedSkills((p) => ({ ...p, [s]: !p[s] }))}
                          className={`text-xs px-3 py-1.5 rounded-md font-mono border transition-all ${on ? "bg-[#22D3EE]/10 text-[#22D3EE] border-cyan-400/40" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/20"}`}
                        >
                          {on ? <Check size={11} className="inline mr-1"/> : <Plus size={11} className="inline mr-1"/>}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {extracted.experience_summary && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Experience summary (context only)</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{extracted.experience_summary}</p>
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <button onClick={applyMerge} disabled={applying} data-testid="linkedin-apply" className="brand-bg brand-bg-hover text-white font-medium px-5 py-2.5 rounded-xl brand-glow inline-flex items-center gap-2 disabled:opacity-40">
                  <Check size={14}/> {applying ? "Merging…" : "Apply selected"}
                </button>
                <button onClick={() => setExtracted(null)} data-testid="linkedin-cancel" className="border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2">
                  <X size={14}/> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {user?.skills?.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-8">
            <div className="overline mb-4">Your skills · {user.skills.length}</div>
            <div className="flex flex-wrap gap-1.5" data-testid="profile-skills">
              {user.skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-md bg-[#22D3EE]/10 text-[#22D3EE] border border-cyan-400/20 font-mono">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, checked, onToggle, testid, hint }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-none">
      <button onClick={onToggle} data-testid={testid} className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked ? "bg-[#22D3EE] border-cyan-400" : "border-white/20 hover:border-white/40"}`}>
        {checked && <Check size={12} className="text-black" strokeWidth={3}/>}
      </button>
      <div className="flex-1">
        <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">{label}</div>
        <div className="text-sm text-zinc-200">{value}</div>
        {hint && <div className="text-[10px] text-zinc-600 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}
