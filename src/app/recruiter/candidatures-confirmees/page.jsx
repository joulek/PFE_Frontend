"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CheckCircle2, Shield, User, Briefcase, Mail, Phone,
  RefreshCw, Search, X, Calendar, FileText, Filter,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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

function ConfirmBadge({ confirmed, label, date, optional = false }) {
  if (!confirmed) return optional
    ? <span className="text-gray-300 dark:text-gray-600 text-sm font-bold">—</span>
    : (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-gray-400 whitespace-nowrap">
        Pas obligatoire
      </span>
    );
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />{label}
      </span>
      {date && <span className="text-[10px] text-gray-400 pl-1">{formatDate(date)}</span>}
    </div>
  );
}

const FILTERS = [
  { key: "all",   label: "Tous" },
  { key: "admin", label: "Confirmés Admin" },
  { key: "dga",   label: "Confirmés DGA" },
];

export default function ConfirmedCandidaturesPage() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (withRefresh = false) => {
    try {
      setError(null);
      if (withRefresh) setRefreshing(true); else setLoading(true);
      const res = await apiFetch(`/candidatures/confirmed?filter=${filter}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || "Erreur chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(c =>
      (c.fullName || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const bothConfirmed = useMemo(() => filtered.filter(c => c.adminConfirmed && c.dgaConfirmed).length, [filtered]);
  const adminOnly     = useMemo(() => filtered.filter(c => c.adminConfirmed && !c.dgaConfirmed).length, [filtered]);
  const dgaOnly       = useMemo(() => filtered.filter(c => !c.adminConfirmed && c.dgaConfirmed).length, [filtered]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-7 h-7 text-[#6CB33F]" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Candidatures Confirmées
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? "Chargement..." : `${filtered.length} candidature${filtered.length > 1 ? "s" : ""}`}
          </p>
        </div>

        

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Filtres */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filter === f.key
                    ? "bg-[#4E8F2F] text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shadow-sm">
            <Search className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, poste)…"
              className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-[#4E8F2F] transition-colors flex-shrink-0">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          {loading && (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-12 text-center">
              <p className="text-red-500 font-semibold">{error}</p>
              <button onClick={() => fetchData(true)} className="mt-4 px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold text-sm">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-semibold">Aucune candidature confirmée</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: "900px" }}>
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {[ "Candidat", "Poste", "Confirmation Admin", "Confirmation DGA", "Date candidature"].map(h => (
                      <th key={h} className="text-left px-5 py-4 font-extrabold uppercase text-xs tracking-wider border-b border-[#d4edc4] dark:border-gray-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={String(c._id)}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        idx % 2 !== 0 ? "bg-gray-50/50 dark:bg-gray-750/30" : ""
                      } hover:bg-[#F0FAF0] dark:hover:bg-gray-700/30 transition-colors`}>

                    

                      {/* Candidat */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const displayName =
                              c.fullName ||
                              [c.prenom, c.nom].filter(Boolean).join(" ").trim() ||
                              c.email?.split("@")[0] ||
                              "?";
                            return (
                              <>
                                <Avatar name={displayName} />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-gray-900 dark:text-white truncate max-w-[180px]">
                                    {displayName !== c.email?.split("@")[0] ? displayName : "—"}
                                  </p>
                                  {c.email && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[180px]">
                                      <Mail className="w-3 h-3 flex-shrink-0" />{c.email}
                                    </p>
                                  )}
                                  {c.telephone && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Phone className="w-3 h-3 flex-shrink-0" />{c.telephone}
                                    </p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Poste */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{c.jobTitle || "—"}</span>
                        </span>
                      </td>

                      {/* Confirmation Admin */}
                      <td className="px-5 py-4">
                        <ConfirmBadge
                          confirmed={c.adminConfirmed}
                          label="Admin ✓"
                          date={c.adminConfirmedAt}
                        />
                      </td>

                      {/* Confirmation DGA */}
                      <td className="px-5 py-4">
                        <ConfirmBadge
                          confirmed={c.dgaConfirmed}
                          label="DGA ✓"
                          date={c.dgaConfirmedAt}
                          optional={true}
                        />
                      </td>

                      {/* Date candidature */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-500 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(c.createdAt)}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}