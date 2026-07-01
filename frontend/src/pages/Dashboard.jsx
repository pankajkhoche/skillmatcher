import React from "react";
import Nav from "@/components/Nav";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FileText, Sparkles, Target, Briefcase, User, MessageSquare, Map, History, GitCompare, ArrowUpRight } from "lucide-react";

const FEATURES = [
  { path: "/resume", title: "Resume Analyzer", desc: "ATS score, pros, cons, and edits.", icon: <FileText strokeWidth={1.5} />, testid: "card-resume", live: true, num: "01" },
  { path: "/rewriter", title: "AI Rewriter", desc: "Paste a JD. Get a resume tuned for it. Download PDF.", icon: <Sparkles strokeWidth={1.5} />, testid: "card-rewriter", live: true, num: "02", featured: true },
  { path: "/skills", title: "Skills & Role Fit", desc: "Which roles fit you — and skills to acquire.", icon: <Target strokeWidth={1.5} />, testid: "card-skills", live: true, num: "03" },
  { path: "/jobs", title: "Job Matcher", desc: "Curated roles ranked by fit against your profile.", icon: <Briefcase strokeWidth={1.5} />, testid: "card-jobs", live: true, num: "04" },
  { path: null, title: "Interview Prep", desc: "AI mock interviews with instant feedback.", icon: <MessageSquare strokeWidth={1.5} />, testid: "card-interview", live: false, num: "05" },
  { path: null, title: "Career Roadmap", desc: "Long-term trajectory planning.", icon: <Map strokeWidth={1.5} />, testid: "card-roadmap", live: false, num: "06" },
  { path: null, title: "Interview History", desc: "Review past interviews and scores.", icon: <History strokeWidth={1.5} />, testid: "card-history", live: false, num: "07" },
  { path: null, title: "Resume Compare", desc: "A/B compare two resume versions.", icon: <GitCompare strokeWidth={1.5} />, testid: "card-compare", live: false, num: "08" },
  { path: "/profile", title: "Profile", desc: "Your target role, skills, and preferences.", icon: <User strokeWidth={1.5} />, testid: "card-profile", live: true, num: "09" },
];

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-16 max-w-3xl fade-up">
          <div className="overline mb-4">Command center</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter" data-testid="dashboard-greeting">
            Welcome back, <span className="text-[#D4AF37]">{user?.name?.split(" ")[0] || "there"}</span>.
          </h1>
          <p className="text-lg text-zinc-500 mt-4 leading-relaxed">Start with the Analyzer, then rewrite your resume for a specific job. Your edge — in four clicks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const disabled = !f.path;
            const featured = f.featured;
            const cls = `group relative rounded-2xl border p-7 card-hover h-full ${
              disabled ? "opacity-40 cursor-not-allowed border-white/[0.06] bg-[#0A0A0A]" :
              featured ? "border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/[0.06] to-transparent" :
              "border-white/[0.06] bg-[#0A0A0A]"
            }`;
            const Inner = (
              <div className={cls}>
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${featured ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-white/[0.03] text-zinc-400"}`}>
                    {f.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {!f.live && <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">Soon</span>}
                    {f.live && !disabled && <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-[#D4AF37] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={1.5}/>}
                    <span className="font-mono text-xs text-zinc-700">{f.num}</span>
                  </div>
                </div>
                <h3 className="font-heading text-xl font-medium mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            );
            return f.path ? (
              <Link key={f.title} to={f.path} data-testid={f.testid}>{Inner}</Link>
            ) : (
              <div key={f.title} data-testid={f.testid}>{Inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
