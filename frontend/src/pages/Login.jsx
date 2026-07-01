import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
      toast.success("Welcome back!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-[hsl(160,51%,70%)] border-r-2 border-black p-12 items-center">
        <div>
          <Link to="/" className="font-display font-black text-3xl mb-8 inline-block">TalentIQ</Link>
          <h1 className="font-display font-black text-5xl leading-tight tracking-tight mb-4">Welcome back, hustler.</h1>
          <p className="text-lg">Your dashboard. Your score. Your next role — one click away.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-[hsl(48,30%,96%)]">
        <form onSubmit={submit} className="brut-card p-8 w-full max-w-md" data-testid="login-form">
          <h2 className="font-display font-black text-3xl mb-6">Log in</h2>
          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Email</label>
          <input data-testid="login-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 border-black px-4 py-3 mb-4 bg-white" />
          <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-2">Password</label>
          <input data-testid="login-password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border-2 border-black px-4 py-3 mb-6 bg-white" />
          <button data-testid="login-submit" disabled={loading} className="brut-btn w-full bg-yellow-300 py-3">{loading ? "Logging in..." : "Log in"}</button>
          <p className="text-sm mt-4 text-center">No account? <Link to="/signup" className="font-bold underline">Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}
