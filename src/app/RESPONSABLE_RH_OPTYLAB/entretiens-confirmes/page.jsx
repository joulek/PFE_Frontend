"use client";
// app/RESPONSABLE_RH_OPTYLAB/entretiens-confirmes/page.jsx

import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Search, ChevronLeft, ChevronRight,
  User, Briefcase, Clock, CheckCircle2,
  Loader2, AlertCircle, RefreshCw, MapPin,
  Pencil, Save, Trash2, X, StickyNote,
} from "lucide-react";
import api from "../../services/api";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function formatTime(t) {
  if (!t) return "—";
  if (typeof t === "string" && t.includes(":")) return t;
  return new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function TypeBadge({ type }) {
  const isRhTech = type === "rh_technique";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
      isRhTech
        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        : "bg-[#e8f5e0] text-[#3d7524] dark:bg-[#4E8F2F]/20 dark:text-[#7dc854]"
    }`}>
      {isRhTech ? "RH + Tech" : "RH"}
    </span>
  );
}

function Pagination({ page, totalPages, total, limit, onChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600 dark:text-gray-300">{from}–{to}</span> sur{" "}
        <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p); return acc;
          }, [])
          .map((p, i) => p === "..." ? (
            <span key={`e${i}`} className="text-gray-400 px-1 text-xs">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                p === page
                  ? "bg-[#4E8F2F] text-white"
                  : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}>{p}</button>
          ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ConfirmedInterviewsPage() {
  const [interviews, setInterviews]   = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const LIMIT = 15;

  // Note state: { [interviewId]: { editing: bool, text: string, saving: bool } }
  const [noteState, setNoteState] = useState({});

  function startEdit(iv) {
    setNoteState(prev => ({
      ...prev,
      [iv._id]: { editing: true, text: iv.rhNordNote?.text || "", saving: false },
    }));
  }

  function cancelEdit(id) {
    setNoteState(prev => ({ ...prev, [id]: { ...prev[id], editing: false } }));
  }

  async function saveNote(iv) {
    const text = noteState[iv._id]?.text?.trim();
    setNoteState(prev => ({ ...prev, [iv._id]: { ...prev[iv._id], saving: true } }));
    try {
      await api.post(`/api/interviews/${iv._id}/rh-nord-note`, { text });
      setInterviews(prev => prev.map(i =>
        String(i._id) === String(iv._id)
          ? { ...i, rhNordNote: { text } }
          : i
      ));
      setNoteState(prev => ({ ...prev, [iv._id]: { editing: false, text, saving: false } }));
    } catch {
      setNoteState(prev => ({ ...prev, [iv._id]: { ...prev[iv._id], saving: false } }));
    }
  }

  async function deleteNote(iv) {
    if (!confirm("Supprimer cette note ?")) return;
    setNoteState(prev => ({ ...prev, [iv._id]: { editing: false, text: "", saving: true } }));
    try {
      await api.delete(`/api/interviews/${iv._id}/rh-nord-note`);
      setInterviews(prev => prev.map(i =>
        String(i._id) === String(iv._id)
          ? { ...i, rhNordNote: null }
          : i
      ));
    } finally {
      setNoteState(prev => ({ ...prev, [iv._id]: { editing: false, text: "", saving: false } }));
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search.trim()) params.set("search", search.trim());
      const { data } = await api.get(`/api/interviews/confirmed?${params}`);
      setInterviews(data.interviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors du chargement");
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4E8F2F] to-[#3d7524] flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Entretiens confirmés</h1>
              <p className="text-xs text-gray-400">
                {loading ? "Chargement..." : `${total} entretien${total > 1 ? "s" : ""} confirmé${total > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Rechercher un candidat, poste..."
                value={searchInput} onChange={e => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#4E8F2F] focus:ring-1 focus:ring-[#4E8F2F]/30 w-64 transition-all" />
            </div>
            <button onClick={fetchData} title="Actualiser"
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total confirmés", value: total,                                                                  icon: CheckCircle2, color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/10"   },
            { label: "Cette page",      value: interviews.length,                                                      icon: Calendar,     color: "text-[#4E8F2F]", bg: "bg-[#f0faf0] dark:bg-[#4E8F2F]/10"  },
            { label: "RH + Tech",       value: interviews.filter(i => i.interviewType === "rh_technique").length,     icon: User,         color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10" },
            { label: "RH seul",         value: interviews.filter(i => i.interviewType !== "rh_technique").length,     icon: Briefcase,    color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/10"     },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-3`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Planification */}
        {interviews.length > 0 && (() => {
          const upcoming = interviews
            .map(iv => iv.confirmedDate || iv.proposedDate)
            .filter(Boolean)
            .map(d => new Date(d))
            .sort((a, b) => a - b);
          const next = upcoming.find(d => d >= new Date());
          if (!next) return null;
          const label = next.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
          return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-[#f0faf0] dark:bg-[#4E8F2F]/10 border-b border-gray-100 dark:border-gray-700/50">
                <p className="text-[11px] font-extrabold text-[#4E8F2F] uppercase tracking-widest">Planification</p>
              </div>
              <div className="px-5 py-4 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 flex-shrink-0 shadow-sm" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Planifié {label}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#4E8F2F]" />
              <p className="text-sm text-gray-400">Chargement...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 m-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                <button onClick={fetchData} className="text-xs text-red-500 underline mt-0.5">Réessayer</button>
              </div>
            </div>
          )}

          {!loading && !error && interviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-600 dark:text-gray-300">Aucun entretien confirmé</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? `Aucun résultat pour « ${search} »` : "Aucun entretien confirmé pour le moment."}
              </p>
            </div>
          )}

          {!loading && !error && interviews.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/50">
                    {[
                      { label: "#",             icon: null         },
                      { label: "Candidat",      icon: User         },
                      { label: "Poste",         icon: Briefcase    },
                      { label: "Planification", icon: Calendar     },
                      { label: "Note",          icon: StickyNote   },
                      { label: "Type",          icon: null         },
                      { label: "Statut",        icon: CheckCircle2 },
                    ].map(({ label, icon: Icon }) => (
                      <th key={label} className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {Icon && <Icon className="w-3 h-3" />}
                          {label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                  {interviews.map((iv, idx) => {
                    const date = iv.confirmedDate || iv.proposedDate;
                    const time = iv.confirmedTime || iv.proposedTime;
                    return (
                      <tr key={String(iv._id)} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">

                        {/* # */}
                        <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                          {(page - 1) * LIMIT + idx + 1}
                        </td>

                        {/* Candidat */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4E8F2F] to-[#3d7524] flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">
                                {(iv.candidateName || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{iv.candidateName || "—"}</p>
                              <p className="text-[11px] text-gray-400">{iv.candidateEmail || ""}</p>
                            </div>
                          </div>
                        </td>

                        {/* Poste */}
                        <td className="px-5 py-4 font-medium text-gray-700 dark:text-gray-300 max-w-[180px]">
                          <span className="truncate block">{iv.jobTitle || "—"}</span>
                        </td>

                        {/* Planification */}
                        <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col gap-2">
                            {/* Planifié (date création) */}
                            {iv.createdAt && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                                <span>Planifié {formatDate(iv.createdAt)}</span>
                              </div>
                            )}

                            {/* Confirmé — toujours affiché car page entretiens-confirmés */}
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>Confirmé {formatDate(iv.confirmedDate || iv.proposedDate || date)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Note RH Nord */}
                        <td className="px-5 py-4 max-w-[220px]">
                          {noteState[iv._id]?.editing ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                autoFocus
                                rows={3}
                                value={noteState[iv._id]?.text || ""}
                                onChange={e => setNoteState(prev => ({ ...prev, [iv._id]: { ...prev[iv._id], text: e.target.value } }))}
                                className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4E8F2F]/30 focus:border-[#4E8F2F] resize-none"
                                placeholder="Saisir une note..."
                              />
                              <div className="flex items-center gap-2">
                                <button onClick={() => saveNote(iv)} disabled={noteState[iv._id]?.saving}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4E8F2F] hover:bg-[#3d7524] text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                                  <Save className="w-3 h-3" />
                                  {noteState[iv._id]?.saving ? "..." : "Sauv."}
                                </button>
                                <button onClick={() => cancelEdit(iv._id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <X className="w-3 h-3" />
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : iv.rhNordNote?.text ? (
                            <div className="group flex flex-col gap-1.5">
                              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                                {iv.rhNordNote.text}
                              </p>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(iv)}
                                  className="flex items-center gap-1 text-[11px] text-[#4E8F2F] font-semibold hover:underline">
                                  <Pencil className="w-3 h-3" /> Modifier
                                </button>
                                <button onClick={() => deleteNote(iv)}
                                  className="flex items-center gap-1 text-[11px] text-red-500 font-semibold hover:underline">
                                  <Trash2 className="w-3 h-3" /> Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(iv)}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4E8F2F] transition-colors group">
                              <Pencil className="w-3.5 h-3.5 group-hover:text-[#4E8F2F]" />
                              <span>Ajouter une note</span>
                            </button>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <TypeBadge type={iv.interviewType} />
                        </td>

                        {/* Statut */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-[11px] font-bold text-green-600 dark:text-green-400">Confirmé</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT}
                onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}