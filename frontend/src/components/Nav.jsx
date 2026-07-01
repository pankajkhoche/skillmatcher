import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";

export default function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const linkCls = (path) =>
    `px-3 py-1.5 font-bold text-sm border-2 border-black transition-all ${
      loc.pathname === path
        ? "bg-black text-white"
        : "bg-white hover:bg-yellow-300"
    }`;

  return (
    <nav className="border-b-2 border-black bg-[hsl(48,30%,96%)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-9 h-9 bg-yellow-300 border-2 border-black brut-shadow-sm flex items-center justify-center font-black text-lg">T</div>
          <span className="font-display font-black text-2xl tracking-tighter">TalentIQ</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            <Link data-testid="nav-dashboard" to="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
            <Link data-testid="nav-resume" to="/resume" className={linkCls("/resume")}>Resume</Link>
            <Link data-testid="nav-rewriter" to="/rewriter" className={linkCls("/rewriter")}>Rewriter</Link>
            <Link data-testid="nav-skills" to="/skills" className={linkCls("/skills")}>Skills</Link>
            <Link data-testid="nav-jobs" to="/jobs" className={linkCls("/jobs")}>Jobs</Link>
            <Link data-testid="nav-profile" to="/profile" className="w-9 h-9 border-2 border-black flex items-center justify-center bg-[hsl(270,60%,82%)] hover:bg-[hsl(160,51%,70%)]"><User size={16} /></Link>
            <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="w-9 h-9 border-2 border-black flex items-center justify-center bg-white hover:bg-red-300"><LogOut size={16} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link data-testid="nav-login" to="/login" className="px-4 py-2 font-bold border-2 border-black bg-white brut-btn text-sm">Log in</Link>
            <Link data-testid="nav-signup" to="/signup" className="px-4 py-2 font-bold border-2 border-black bg-yellow-300 brut-btn text-sm">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
