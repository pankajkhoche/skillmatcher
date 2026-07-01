import React from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import { FileText, Sparkles, Target, Briefcase, ArrowUpRight, Zap, Award, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#06060B] text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="relative">
        <Nav />

        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-32">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 fade-up">
              <div className="overline mb-8">— For ambitious talent</div>
              <h1 className="font-heading font-light text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.02] mb-8">
                Your career, <br />
                engineered by <span className="text-[#C084FC] italic font-normal">intelligence.</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
                Instant ATS analysis. AI-rewritten resumes tuned to any job. Precision role-fit intelligence. TalentIQ is the operating system for professionals who take their trajectory seriously.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup" data-testid="hero-cta-signup" className="group brand-bg text-white font-medium px-6 py-3.5 rounded-xl transition-all duration-300 brand-bg-hover brand-glow inline-flex items-center gap-2">
                  Analyze your resume <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                </Link>
                <Link to="/login" data-testid="hero-cta-login" className="border border-white/10 text-white font-medium px-6 py-3.5 rounded-xl transition-all duration-300 hover:bg-white/[0.03] hover:border-white/20">
                  I have an account
                </Link>
              </div>
              <div className="mt-14 flex items-center gap-8 text-sm text-zinc-500">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> <span className="font-mono uppercase tracking-wider text-xs">Live</span></div>
                <span>10,000+ profiles optimized</span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline">Claude Sonnet 4.5</span>
              </div>
            </div>

            <div className="lg:col-span-5 relative fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="relative">
                {/* 3D floating shape behind */}
                <div className="absolute -top-16 -right-16 pointer-events-none opacity-60">
                  <div className="shape-3d">
                    <div className="shape-face" />
                    <div className="shape-face" style={{ transform: "rotateY(60deg)" }} />
                    <div className="shape-face" style={{ transform: "rotateY(120deg)" }} />
                    <div className="shape-face" style={{ transform: "rotateY(180deg)" }} />
                    <div className="shape-face" style={{ transform: "rotateY(240deg)" }} />
                    <div className="shape-face" style={{ transform: "rotateY(300deg)" }} />
                  </div>
                </div>
                {/* Main glass card */}
                <div className="glass rounded-2xl p-8 relative overflow-hidden float">
                  <div className="flex items-center justify-between mb-6">
                    <div className="overline">ATS Report</div>
                    <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" /> Live
                    </div>
                  </div>
                  <div className="font-heading font-light text-7xl tracking-tighter mb-2">
                    <span className="brand-text">87</span><span className="text-3xl text-zinc-600">/100</span>
                  </div>
                  <div className="text-sm text-zinc-500 mb-6">Senior Software Engineer</div>
                  <div className="space-y-3">
                    {[["Keywords", 92], ["Impact", 78], ["Formatting", 95], ["Clarity", 84]].map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-zinc-500">{k}</span>
                          <span className="font-mono text-zinc-300">{v}</span>
                        </div>
                        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#C084FC]/50 to-[#C084FC]" style={{ width: `${v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Small overlay card */}
                <div className="glass rounded-xl p-4 absolute -bottom-8 -left-8 w-64 ring-gold">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-[#C084FC]" strokeWidth={2} />
                    <div className="overline">Match improved</div>
                  </div>
                  <div className="font-heading text-2xl font-light">35 → <span className="text-[#C084FC]">92</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial ribbon */}
        <div className="border-y border-white/[0.06] py-6 marquee">
          <div className="marquee-track font-mono uppercase tracking-[0.3em] text-sm text-zinc-500">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-16">
                <span>Trusted by ambitious talent</span>
                <span className="text-[#C084FC]">◆</span>
                <span>ATS-grade analysis</span>
                <span className="text-[#C084FC]">◆</span>
                <span>Real-time rewriting</span>
                <span className="text-[#C084FC]">◆</span>
                <span>Role-fit intelligence</span>
                <span className="text-[#C084FC]">◆</span>
                <span>Precision job matching</span>
                <span className="text-[#C084FC]">◆</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="max-w-2xl mb-16">
            <div className="overline mb-4">The toolkit</div>
            <h2 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter leading-tight">
              Four instruments. <br /> <span className="text-zinc-500">One unfair advantage.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={<FileText strokeWidth={1.5} />} title="ATS Analyzer" desc="See exactly what recruiter software sees. Score, breakdown, and surgical suggestions." num="01" />
            <FeatureCard icon={<Sparkles strokeWidth={1.5} />} title="AI Rewriter" desc="Paste any job description. Get a resume tuned for that specific role — as a PDF." num="02" featured />
            <FeatureCard icon={<Target strokeWidth={1.5} />} title="Role Fit" desc="Which roles you should chase — and precisely which skills to acquire first." num="03" />
            <FeatureCard icon={<Briefcase strokeWidth={1.5} />} title="Job Matcher" desc="Curated roles ranked against your profile. No noise. Just fit." num="04" />
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-32">
          <div className="glass rounded-3xl p-14 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] via-transparent to-transparent" />
            <div className="relative">
              <Award className="mx-auto mb-6 text-[#C084FC]" size={40} strokeWidth={1.2} />
              <h2 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter mb-5">Stop guessing. Start landing.</h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">TalentIQ turns your resume into a machine-optimized asset — free, in seconds.</p>
              <Link to="/signup" data-testid="cta-signup" className="brand-bg text-white font-medium px-8 py-4 rounded-xl inline-flex items-center gap-2 brand-bg-hover transition-all brand-glow">
                Begin — it's free <ArrowUpRight size={18} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-wrap justify-between text-sm text-zinc-500">
            <span>© 2026 TalentIQ</span>
            <span className="font-mono uppercase tracking-wider text-xs">Engineered for intent.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, num, featured }) {
  return (
    <div className={`group relative rounded-2xl border p-8 card-hover ${featured ? "bg-gradient-to-br from-purple-500/[0.06] to-transparent border-purple-400/20" : "bg-[#0A0A12] border-white/[0.06]"}`}>
      <div className="flex items-start justify-between mb-8">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${featured ? "bg-[#C084FC]/10 text-[#C084FC]" : "bg-white/[0.03] text-zinc-400"}`}>
          {icon}
        </div>
        <span className="font-mono text-xs text-zinc-600">{num}</span>
      </div>
      <h3 className="font-heading text-xl font-medium mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
