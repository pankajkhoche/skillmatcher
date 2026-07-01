import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Sparkles } from "lucide-react";

export default function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const linkCls = (path) =>
    `text-sm font-medium transition-colors ${
      loc.pathname === path ? "text-white" : "text-zinc-500 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5" data-testid="nav-logo">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8B7318] flex items-center justify-center">
            <Sparkles size={16} className="text-black" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-medium text-xl tracking-tight">Talent<span className="text-[#D4AF37]">IQ</span></span>
        </Link>

        {user ? (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link data-testid="nav-dashboard" to="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
              <Link data-testid="nav-resume" to="/resume" className={linkCls("/resume")}>Analyzer</Link>
              <Link data-testid="nav-rewriter" to="/rewriter" className={linkCls("/rewriter")}>Rewriter</Link>
              <Link data-testid="nav-skills" to="/skills" className={linkCls("/skills")}>Skills</Link>
              <Link data-testid="nav-jobs" to="/jobs" className={linkCls("/jobs")}>Jobs</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link data-testid="nav-profile" to="/profile" className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all"><User size={15} strokeWidth={1.5} /></Link>
              <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all"><LogOut size={15} strokeWidth={1.5} /></button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link data-testid="nav-login" to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Sign in</Link>
            <Link data-testid="nav-signup" to="/signup" className="text-sm font-medium bg-[#D4AF37] text-black hover:bg-[#FDE047] px-4 py-2 rounded-lg transition-all gold-glow">Get started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
