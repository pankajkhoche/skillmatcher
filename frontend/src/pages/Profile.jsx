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
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const initials = (user?.name || "?").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="brut-card p-8 bg-white mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 border-2 border-black bg-[hsl(54,100%,50%)] brut-shadow-sm flex items-center justify-center font-display font-black text-3xl" data-testid="profile-avatar">{initials}</div>
            <div>
              <h1 className="font-display font-black text-3xl">{user?.name}</h1>
              <p className="text-sm">{user?.email}</p>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider">{user?.role === "job_seeker" ? "Job Seeker" : "Student"}</div>
            </div>
          </div>
        </div>

        <div className="brut-card p-6 bg-white mb-6">
          <h2 className="font-display font-black text-xl mb-4">Details</h2>
          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Full Name</label>
          <input data-testid="profile-name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full border-2 border-black px-4 py-3 mb-4 bg-white"/>
          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Target Role</label>
          <input data-testid="profile-target-role" value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} placeholder="e.g. Software Engineer" className="w-full border-2 border-black px-4 py-3 bg-white"/>
          <button onClick={save} disabled={saving} data-testid="profile-save" className="brut-btn bg-yellow-300 px-6 py-2.5 mt-5">{saving ? "Saving..." : "Save changes"}</button>
        </div>

        {user?.skills?.length > 0 && (
          <div className="brut-card p-6 bg-white">
            <h2 className="font-display font-black text-xl mb-4">Your Skills</h2>
            <div className="flex flex-wrap gap-2" data-testid="profile-skills">
              {user.skills.map((s) => (
                <span key={s} className="border-2 border-black bg-[hsl(270,60%,82%)] px-3 py-1 font-bold text-sm">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
