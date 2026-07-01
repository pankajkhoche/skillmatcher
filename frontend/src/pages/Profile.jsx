import React, { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [targetRole, setTargetRole] = useState(user?.target_role || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setTargetRole(user?.target_role || "");
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/profile", { name, target_role: targetRole });
      updateUser(r.data.user);
      toast.success("Saved");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const initials = (user?.name || "?").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-8 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B7318] flex items-center justify-center font-heading font-medium text-2xl text-black" data-testid="profile-avatar">{initials}</div>
            <div>
              <h1 className="font-heading text-3xl font-light tracking-tight">{user?.name}</h1>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              <div className="overline mt-2">{user?.role === "job_seeker" ? "Professional" : "Student"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-8 mb-4">
          <div className="overline mb-6">Details</div>
          <label className="overline block mb-2">Full name</label>
          <input data-testid="profile-name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 mb-5 focus:border-[#D4AF37]/50 transition-colors"/>
          <label className="overline block mb-2">Target role</label>
          <input data-testid="profile-target-role" value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} placeholder="Software Engineer" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 focus:border-[#D4AF37]/50 transition-colors placeholder:text-zinc-700"/>
          <button onClick={save} disabled={saving} data-testid="profile-save" className="bg-[#D4AF37] text-black font-medium px-6 py-2.5 mt-6 rounded-xl hover:bg-[#FDE047] transition-all gold-glow disabled:opacity-40">{saving ? "Saving…" : "Save changes"}</button>
        </div>

        {user?.skills?.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-8">
            <div className="overline mb-4">Your skills</div>
            <div className="flex flex-wrap gap-1.5" data-testid="profile-skills">
              {user.skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 font-mono">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
