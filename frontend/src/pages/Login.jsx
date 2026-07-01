import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden border-r border-white/[0.06] p-12 items-end">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#D4AF37]/[0.05] rounded-full blur-[100px]"/>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-[#D4AF37]/[0.08] rounded-full blur-[80px]"/>
        </div>
        <div className="relative">
          <Link to="/" className="font-heading font-medium text-2xl mb-16 inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8B7318] flex items-center justify-center"><Sparkles size={16} className="text-black" strokeWidth={2.5}/></div>
            Talent<span className="text-[#D4AF37]">IQ</span>
          </Link>
          <blockquote className="font-heading text-4xl font-light leading-tight tracking-tight mb-6 italic">
            "The best career advice, structured for you."
          </blockquote>
          <div className="text-sm text-zinc-500">Where ambition meets precision.</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="login-form">
          <div className="overline mb-3">Sign in</div>
          <h1 className="font-heading text-3xl font-light tracking-tight mb-10">Welcome back.</h1>

          <label className="overline block mb-2">Email</label>
          <input data-testid="login-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 mb-5 focus:border-[#D4AF37] transition-colors placeholder:text-zinc-700" placeholder="you@work.com"/>

          <label className="overline block mb-2">Password</label>
          <input data-testid="login-password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 mb-8 focus:border-[#D4AF37] transition-colors placeholder:text-zinc-700" placeholder="••••••••"/>

          <button data-testid="login-submit" disabled={loading} className="w-full bg-[#D4AF37] text-black font-medium py-3 rounded-xl hover:bg-[#FDE047] transition-all gold-glow inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Signing in..." : (<>Sign in <ArrowUpRight size={16}/></>)}
          </button>
          <p className="text-sm mt-6 text-zinc-500 text-center">No account? <Link to="/signup" className="text-white hover:text-[#D4AF37] transition-colors">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
