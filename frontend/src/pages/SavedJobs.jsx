import React, { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";

const STATUSES = [
  { id: "bookmarked", label: "Bookmarked", color: "bg-white/[0.03] border-white/10 text-zinc-300" },
  { id: "applied", label: "Applied", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" },
  { id: "interviewing", label: "Interviewing", color: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
  { id: "offered", label: "Offered", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
  { id: "rejected", label: "Rejected", color: "bg-red-500/10 border-red-500/30 text-red-300" },
];

export default function SavedJobs() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try { const r = await api.get("/jobs/saved"); setItems(r.data.items || []); }
    catch (e) { console.warn("saved jobs load failed", e); toast.error("Failed to load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try { await api.put(`/jobs/saved/${id}`, { status, notes: "" }); toast.success(`Marked ${status}`); load(); }
    catch (e) { console.warn("set status failed", e); toast.error("Failed"); }
  };
  const del = async (id) => {
    try { await api.delete(`/jobs/saved/${id}`); toast.success("Removed"); load(); }
    catch (e) { console.warn("delete saved job failed", e); toast.error("Failed"); }
  };

  const filtered = filter === "all" ? items : items.filter(x => x.status === filter);
  const counts = STATUSES.reduce((acc, s) => ({...acc, [s.id]: items.filter(x => x.status === s.id).length}), {});

  return (
    <div className="min-h-screen bg-[#06060B] text-white">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14">
        <div className="mb-8">
          <div className="overline mb-3">Apply tracker</div>
          <h1 className="font-heading font-light text-4xl sm:text-5xl tracking-tighter">Every application, <span className="brand-text italic">tracked.</span></h1>
        </div>

        <div className="flex gap-2 flex-wrap border-b border-white/[0.06] mb-6">
          <button onClick={()=>setFilter("all")} data-testid="saved-tab-all" className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${filter==="all"? "border-cyan-400 text-white":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>All <span className="font-mono text-xs text-zinc-600">({items.length})</span></button>
          {STATUSES.map(s => (
            <button key={s.id} onClick={()=>setFilter(s.id)} data-testid={`saved-tab-${s.id}`} className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${filter===s.id? "border-cyan-400 text-white":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{s.label} <span className="font-mono text-xs text-zinc-600">({counts[s.id]||0})</span></button>
          ))}
        </div>

        {!filtered.length && <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-12 text-center text-zinc-500">No saved jobs {filter!=="all"?`in "${filter}"`:""}. Bookmark jobs from the Jobs page.</div>}

        <div className="space-y-3">
          {filtered.map(j => (
            <div key={j.id} className="rounded-2xl border border-white/[0.06] bg-[#0A0A12] p-5 card-hover" data-testid={`saved-job-${j.id}`}>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg font-medium">{j.title}</h3>
                  <div className="text-sm text-zinc-500 mt-1">{j.company} · {j.location} {j.salary_range?`· ${j.salary_range}`:""}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {STATUSES.map(s => (
                      <button key={s.id} onClick={()=>setStatus(j.id, s.id)} data-testid={`saved-set-${j.id}-${s.id}`}
                        className={`text-xs px-2.5 py-1 rounded-md border font-mono ${j.status===s.id? s.color+" ring-1 ring-white/20":"bg-transparent border-white/5 text-zinc-600 hover:text-zinc-300 hover:border-white/15"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-white/10 hover:border-cyan-400/40 flex items-center justify-center text-zinc-400 hover:text-cyan-300"><ExternalLink size={14}/></a>}
                  <button onClick={()=>del(j.id)} data-testid={`saved-del-${j.id}`} className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-400/40 flex items-center justify-center text-zinc-400 hover:text-red-300"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
