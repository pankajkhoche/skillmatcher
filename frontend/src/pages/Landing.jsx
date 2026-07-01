import React from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import { FileText, Sparkles, Target, Briefcase, Zap, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[hsl(48,30%,96%)]">
      <Nav />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-block bg-[hsl(270,60%,82%)] border-2 border-black px-3 py-1 mb-6 brut-shadow-sm">
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Built for students & job seekers</span>
            </div>
            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tighter mb-6" data-testid="landing-title">
              Crack the code<br/> to your <span className="bg-yellow-300 border-2 border-black px-3 inline-block -rotate-1">career.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-8 text-black/75">
              Upload your resume. Get an instant ATS score, an AI-rewrite tuned to any job, and know exactly which roles fit you — all in one tool.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" data-testid="hero-cta-signup" className="brut-btn bg-yellow-300 px-6 py-3 text-base inline-flex items-center gap-2">
                <Sparkles size={18}/> Analyze my resume
              </Link>
              <Link to="/login" data-testid="hero-cta-login" className="brut-btn bg-white px-6 py-3 text-base">I have an account</Link>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm">
              <div className="flex -space-x-2">
                {["#FEE440","#A0E7D1","#D6BCF7"].map((c,i)=>(
                  <div key={i} className="w-8 h-8 border-2 border-black rounded-full" style={{background:c}}/>
                ))}
              </div>
              <span className="font-bold">Trusted by 10,000+ ambitious job seekers</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="brut-card p-6 rotate-2">
                <div className="flex justify-between mb-3">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase">ATS Report</span>
                  <span className="bg-[hsl(152,60%,45%)] text-white text-xs px-2 py-0.5 border-2 border-black font-bold">LIVE</span>
                </div>
                <div className="text-7xl font-display font-black">87<span className="text-2xl">/100</span></div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span>Keywords</span><span className="font-bold">92</span></div>
                  <div className="flex justify-between"><span>Impact</span><span className="font-bold">78</span></div>
                  <div className="flex justify-between"><span>Formatting</span><span className="font-bold">95</span></div>
                </div>
              </div>
              <div className="brut-card p-4 -rotate-3 absolute -bottom-8 -left-6 w-64 bg-[hsl(160,51%,70%)]">
                <div className="text-xs font-bold tracking-[0.2em] uppercase mb-2">Top Role Match</div>
                <div className="font-display font-black text-xl">Frontend Engineer</div>
                <div className="text-sm mt-1">94% fit · 5 skills to learn</div>
              </div>
              <div className="brut-card p-3 rotate-6 absolute -top-6 -right-4 bg-yellow-300">
                <Zap size={20} className="inline mr-1"/> <span className="font-bold text-sm">Rewritten in 8s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y-2 border-black bg-black text-white py-4 marquee">
        <div className="marquee-track font-display font-black text-2xl">
          {Array.from({length:2}).map((_,i)=>(
            <div key={i} className="flex items-center gap-12">
              <span>ATS OPTIMIZED</span><span>★</span>
              <span>AI INTERVIEWS</span><span>★</span>
              <span>REAL-TIME REWRITE</span><span>★</span>
              <span>ROLE FIT</span><span>★</span>
              <span>JOB MATCHING</span><span>★</span>
              <span>SKILL ROADMAP</span><span>★</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3">What you get</div>
          <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight">Four tools. One unfair advantage.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard bg="hsl(54, 100%, 50%)" icon={<FileText />} title="ATS Resume Analyzer" desc="Get a score, pros, cons, and precise suggestions. Know exactly what recruiters see."/>
          <FeatureCard bg="hsl(160, 51%, 70%)" icon={<Sparkles />} title="Real-Time Rewriter" desc="Paste any job description. Watch your resume get rewritten to match — download as PDF."/>
          <FeatureCard bg="hsl(270, 60%, 82%)" icon={<Target />} title="Skill Role Fit" desc="Enter your skills, see which roles fit best, and get a step-by-step learning roadmap."/>
          <FeatureCard bg="white" icon={<Briefcase />} title="Smart Job Matches" desc="Get personalized job suggestions ranked by match score against your resume & skills."/>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="brut-card brut-shadow-lg p-12 md:p-16 bg-yellow-300 text-center">
          <Award className="mx-auto mb-4" size={40}/>
          <h2 className="font-display font-black text-4xl sm:text-5xl mb-4 tracking-tight">Stop guessing. Start landing.</h2>
          <p className="text-lg max-w-xl mx-auto mb-8">TalentIQ turns your resume into a machine-optimized weapon — for free, in seconds.</p>
          <Link to="/signup" data-testid="cta-signup" className="brut-btn bg-black text-white px-8 py-4 text-lg inline-block">Get started free →</Link>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-[hsl(48,30%,96%)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm flex justify-between">
          <span className="font-bold">© 2026 TalentIQ</span>
          <span>Built with intent, not templates.</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ bg, icon, title, desc }) {
  return (
    <div className="brut-card p-6 hover:-translate-y-1 hover:brut-shadow-lg transition-all" style={{ background: bg }}>
      <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-display font-black text-xl mb-2">{title}</h3>
      <p className="text-sm">{desc}</p>
    </div>
  );
}
