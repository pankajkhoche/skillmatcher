import React from "react";
import Nav from "@/components/Nav";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FileText, Sparkles, Target, Briefcase, User, MessageSquare, Map, History, GitCompare } from "lucide-react";

const FEATURES = [
  { path: "/resume", title: "Resume Analyzer", desc: "Upload → get ATS score, pros/cons, and edits.", bg: "hsl(54, 100%, 50%)", icon: <FileText />, testid: "card-resume", live: true },
  { path: "/rewriter", title: "AI Resume Rewriter", desc: "Paste a JD → get a tailored resume + PDF.", bg: "hsl(160, 51%, 70%)", icon: <Sparkles />, testid: "card-rewriter", live: true },
  { path: "/skills", title: "Skills & Role Fit", desc: "See which roles fit + skills you should learn.", bg: "hsl(270, 60%, 82%)", icon: <Target />, testid: "card-skills", live: true },
  { path: "/jobs", title: "Job Matcher", desc: "Personalized job suggestions ranked by fit.", bg: "white", icon: <Briefcase />, testid: "card-jobs", live: true },
  { path: null, title: "Interview Prep", desc: "AI mock interviews with instant feedback.", bg: "white", icon: <MessageSquare />, testid: "card-interview", live: false },
  { path: null, title: "Career Roadmap", desc: "Long-term path from where you are, to where you want to be.", bg: "white", icon: <Map />, testid: "card-roadmap", live: false },
  { path: null, title: "Interview History", desc: "Review past mock interviews and scores.", bg: "white", icon: <History />, testid: "card-history", live: false },
  { path: null, title: "Resume Compare", desc: "A/B compare two resume versions.", bg: "white", icon: <GitCompare />, testid: "card-compare", live: false },
  { path: "/profile", title: "Profile", desc: "Your saved details, target role, and skills.", bg: "hsl(160, 51%, 70%)", icon: <User />, testid: "card-profile", live: true },
];

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Welcome back</div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight" data-testid="dashboard-greeting">Hey, {user?.name?.split(" ")[0] || "there"}. 👋</h1>
          <p className="text-lg mt-2 max-w-2xl">Start with the Resume Analyzer, then rewrite your resume for a specific job — your unfair advantage in 4 clicks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Inner = (
              <div className="brut-card p-6 h-full flex flex-col hover:-translate-y-1 hover:brut-shadow-lg transition-all" style={{ background: f.bg }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center">{f.icon}</div>
                  {!f.live && <span className="text-[10px] font-bold tracking-[0.15em] uppercase bg-black text-white px-2 py-1">Soon</span>}
                  {f.live && f.path && <span className="text-[10px] font-bold tracking-[0.15em] uppercase bg-[hsl(152,60%,45%)] text-white border-2 border-black px-2 py-0.5">Live</span>}
                </div>
                <h3 className="font-display font-black text-xl mb-1">{f.title}</h3>
                <p className="text-sm">{f.desc}</p>
              </div>
            );
            return f.path ? (
              <Link key={f.title} to={f.path} data-testid={f.testid}>{Inner}</Link>
            ) : (
              <div key={f.title} data-testid={f.testid} className="opacity-70 cursor-not-allowed">{Inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
