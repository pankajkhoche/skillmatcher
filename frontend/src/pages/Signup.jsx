import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be 6+ characters");
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#06060B] text-white grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden border-r border-white/[0.06] p-12 items-end">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-16 w-96 h-96 bg-purple-500/[0.06] rounded-full blur-[100px]"/>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/[0.04] rounded-full blur-[80px]"/>
        </div>
        <div className="relative">
          <Link to="/" className="font-heading font-medium text-2xl mb-16 inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C084FC] to-[#EC4899] flex items-center justify-center"><Sparkles size={16} className="text-black" strokeWidth={2.5}/></div>
            Talent<span className="text-[#C084FC]">IQ</span>
          </Link>
          <blockquote className="font-heading text-4xl font-light leading-tight tracking-tight mb-6 italic">
            "Land the offer. Not the rejection."
          </blockquote>
          <div className="text-sm text-zinc-500">Join 10,000+ professionals shaping their future.</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="signup-form">
          <div className="overline mb-3">Create account</div>
          <h1 className="font-heading text-3xl font-light tracking-tight mb-10">Start your journey.</h1>

          <label className="overline block mb-2">Full name</label>
          <input data-testid="signup-name" required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full bg-[#0A0A12] border border-white/10 rounded-xl px-4 py-3 mb-4 focus:border-[#C084FC] transition-colors placeholder:text-zinc-700" placeholder="Jane Doe"/>

          <label className="overline block mb-2">Email</label>
          <input data-testid="signup-email" type="email" required value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full bg-[#0A0A12] border border-white/10 rounded-xl px-4 py-3 mb-4 focus:border-[#C084FC] transition-colors placeholder:text-zinc-700" placeholder="you@work.com"/>

          <label className="overline block mb-2">Password</label>
          <input data-testid="signup-password" type="password" required value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="w-full bg-[#0A0A12] border border-white/10 rounded-xl px-4 py-3 mb-4 focus:border-[#C084FC] transition-colors placeholder:text-zinc-700" placeholder="6+ characters"/>

          <label className="overline block mb-2">I am a</label>
          <div className="grid grid-cols-2 gap-2 mb-8">
            {[["student","Student"],["job_seeker","Professional"]].map(([r,l])=>(
              <button type="button" key={r} data-testid={`signup-role-${r}`} onClick={()=>setForm({...form, role:r})} className={`border rounded-xl py-3 text-sm font-medium transition-all ${form.role===r? "border-[#C084FC] bg-[#C084FC]/10 text-[#C084FC]":"border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>

          <button data-testid="signup-submit" disabled={loading} className="w-full brand-bg text-white font-medium py-3 rounded-xl brand-bg-hover transition-all brand-glow inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Creating..." : (<>Create account <ArrowUpRight size={16}/></>)}
          </button>
          <p className="text-sm mt-6 text-zinc-500 text-center">Have an account? <Link to="/login" className="text-white hover:text-[#C084FC] transition-colors">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
