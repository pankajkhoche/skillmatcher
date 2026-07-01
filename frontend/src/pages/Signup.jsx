import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be 6+ chars");
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-[hsl(270,60%,82%)] border-r-2 border-black p-12 items-center">
        <div>
          <Link to="/" className="font-display font-black text-3xl mb-8 inline-block">TalentIQ</Link>
          <h1 className="font-display font-black text-5xl leading-tight tracking-tight mb-4">Land the offer — not the rejection.</h1>
          <p className="text-lg">Join 10,000+ students & job seekers using AI to level up.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-[hsl(48,30%,96%)]">
        <form onSubmit={submit} className="brut-card p-8 w-full max-w-md" data-testid="signup-form">
          <h2 className="font-display font-black text-3xl mb-6">Create account</h2>

          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Full name</label>
          <input data-testid="signup-name" required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full border-2 border-black px-4 py-3 mb-4 bg-white" />

          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Email</label>
          <input data-testid="signup-email" type="email" required value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full border-2 border-black px-4 py-3 mb-4 bg-white" />

          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Password</label>
          <input data-testid="signup-password" type="password" required value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="w-full border-2 border-black px-4 py-3 mb-4 bg-white" />

          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">I am a</label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {["student", "job_seeker"].map((r)=>(
              <button type="button" key={r} data-testid={`signup-role-${r}`} onClick={()=>setForm({...form, role:r})} className={`border-2 border-black py-3 font-bold text-sm capitalize ${form.role===r? "bg-yellow-300 brut-shadow-sm":"bg-white"}`}>
                {r === "job_seeker" ? "Job Seeker" : "Student"}
              </button>
            ))}
          </div>

          <button data-testid="signup-submit" disabled={loading} className="brut-btn w-full bg-yellow-300 py-3">{loading ? "Creating..." : "Create account"}</button>
          <p className="text-sm mt-4 text-center">Have an account? <Link to="/login" className="font-bold underline">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
