"use client";
// app/entretiens-confirmes/page.jsx

import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Search, User, Briefcase, Clock,
  CheckCircle2, AlertCircle, RefreshCw,
  MapPin, X, UserCheck, Mail,
} from "lucide-react";
import api from "../services/api";

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
function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function TypeBadge({ type }) {
  const isRhTech = type === "rh_technique" || type === "RH + Tech" || type === "rh+tech";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
      isRhTech
        ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700"
        : "bg-[#E9F5E3] dark:bg-[#4E8F2F]/20 text-[#4E8F2F] dark:text-emerald-400 border-[#d7ebcf] dark:border-emerald-700"
    }`}>
      {isRhTech ? "RH + Tech" : "RH"}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className={colorClass}><Icon className="w-5 h-5" /></span>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 px-4 sm:px-8 py-4 sm:py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
      <p className="font-medium">Page {page} sur {totalPages} — Total : {total} entretien{total > 1 ? "s" : ""}</p>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors">
          Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-xs sm:text-sm transition-colors ${
              p === page
                ? "bg-[#6CB33F] border-[#6CB33F] text-white"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700"
            }`}>{p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors">
          Suiv.
        </button>
      </div>
    </div>
  );
}

function groupByCandidate(interviews) {
  const map = new Map();
  for (const iv of interviews) {
    const key = iv.candidateEmail || iv.candidateName || String(iv._id);
    if (!map.has(key)) {
      map.set(key, { candidateName: iv.candidateName, candidateEmail: iv.candidateEmail, items: [] });
    }
    map.get(key).items.push(iv);
  }
  return Array.from(map.values());
}

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

  const groups = groupByCandidate(interviews);
  const rhTechCount = interviews.filter(i =>
    i.interviewType === "rh_technique" || i.interviewType === "RH + Tech"
  ).length;
  const uniqueCandidates = groups.length;

  // Aplatir groupes en lignes avec rowspan
  const rows = [];
  let groupIdx = 0;
  groups.forEach((group) => {
    group.items.forEach((iv, ivIdx) => {
      rows.push({ iv, isFirst: ivIdx === 0, rowspan: group.items.length, candidateName: group.candidateName, candidateEmail: group.candidateEmail, groupIdx });
    });
    groupIdx++;
  });

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">

        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Entretiens confirm&#233;s</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {loading ? "Chargement..." : `${total} entretien${total > 1 ? "s" : ""} · ${uniqueCandidates} candidat${uniqueCandidates > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Total entretiens"  value={total}             colorClass="text-[#4E8F2F] dark:text-emerald-400" icon={CheckCircle2} />
          <StatCard label="Candidats uniques" value={uniqueCandidates} colorClass="text-[#4E8F2F] dark:text-emerald-400" icon={User}         />
          <StatCard label="RH + Tech"         value={rhTechCount}      colorClass="text-violet-500 dark:text-violet-400"  icon={Calendar}    />
          <StatCard label="RH seul"           value={interviews.length - rhTechCount} colorClass="text-blue-500 dark:text-blue-400" icon={Briefcase} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Rechercher un candidat, poste, responsable..."
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400" />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={fetchData}
            className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
              <p className="text-gray-500 text-lg">Chargement des entretiens...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-16 h-16 text-red-400" />
              <p className="text-gray-700 text-lg font-semibold">Erreur de chargement</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button onClick={fetchData} className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm">
                R&#233;essayer
              </button>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Calendar className="w-16 h-16 text-gray-300" />
              <p className="text-gray-700 text-lg font-semibold">Aucun entretien confirm&#233;</p>
            </div>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: "1100px" }}>
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["#", "Candidat", "Poste", "Date & heure", "Lieu", "Type", "Responsable", "Statut"].map((h) => (
                      <th key={h} className="text-left px-5 py-5 font-extrabold uppercase text-xs tracking-wider whitespace-nowrap border-b border-[#d7ebcf] dark:border-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { iv, isFirst, rowspan, candidateName, candidateEmail, groupIdx: gi } = row;
                    const date = iv.confirmedDate || iv.proposedDate;
                    const time = iv.confirmedTime || iv.proposedTime;
                    const isRhTech = iv.interviewType === "rh_technique" || iv.interviewType === "RH + Tech";
                    const evenBg = gi % 2 === 0 ? "" : "bg-gray-50/70 dark:bg-gray-750";
                    const topBorder = isFirst ? "border-t-2 border-[#c8e6bc] dark:border-gray-600" : "border-t border-gray-100 dark:border-gray-700/50";

                    return (
                      <tr key={String(iv._id)} className={`${evenBg} hover:bg-green-50/50 dark:hover:bg-gray-700/30 transition-colors`}>

                        {isFirst && (
                          <td rowSpan={rowspan} className={`px-5 py-4 align-middle border-r border-gray-100 dark:border-gray-700 ${topBorder}`}>
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E9F5E3] dark:bg-emerald-900/30 text-[#4E8F2F] dark:text-emerald-400 font-extrabold text-xs">
                              {gi + 1}
                            </span>
                          </td>
                        )}

                        {isFirst && (
                          <td rowSpan={rowspan} className={`px-5 py-4 align-middle border-r border-gray-100 dark:border-gray-700 ${topBorder}`}>
                            <div className="flex items-center gap-3">
                              <Avatar name={candidateName} />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[160px]">{candidateName || "—"}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[160px]">{candidateEmail || ""}</p>
                                {rowspan > 1 && (
                                  <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-[10px] font-bold border border-[#d7ebcf]">
                                    {rowspan} entretiens
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Poste */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{iv.jobTitle || "—"}</span>
                          </span>
                        </td>

                        {/* Date & heure */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-xs whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-[#4E8F2F] flex-shrink-0" />
                              {formatDate(date)}
                            </span>
                            {time && time !== "—" && (
                              <span className="flex items-center gap-1.5 text-gray-500 text-xs ml-5">
                                <Clock className="w-3 h-3" />{formatTime(time)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Lieu */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          <span className="flex items-center gap-2 text-gray-500 text-xs">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{iv.location || "—"}</span>
                          </span>
                        </td>

                        {/* Type */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          <TypeBadge type={iv.interviewType} />
                        </td>

                        {/* Responsable — tous types */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          {(iv.responsableName || iv.responsableEmail) ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isRhTech ? "bg-violet-100 dark:bg-violet-900/30" : "bg-[#E9F5E3] dark:bg-emerald-900/30"}`}>
                                <UserCheck className={`w-3.5 h-3.5 ${isRhTech ? "text-violet-600 dark:text-violet-400" : "text-[#4E8F2F] dark:text-emerald-400"}`} />
                              </div>
                              <div className="min-w-0">
                                {iv.responsableName && (
                                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate max-w-[140px]">{iv.responsableName}</p>
                                )}
                                {iv.responsableEmail && (
                                  <p className="text-[11px] text-gray-400 truncate max-w-[140px] flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />{iv.responsableEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>

                        {/* Statut */}
                        <td className={`px-5 py-4 ${topBorder}`}>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Confirm&#233;
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total}
              onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </div>
        )}

      </div>
    </div>
  );
}
