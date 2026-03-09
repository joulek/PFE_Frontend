"use client";

import { useEffect, useState } from "react";
import {
  Mail, Phone, FileText, Briefcase,
  UserCircle, ChevronLeft, ChevronRight,
  Search, Loader2
} from "lucide-react";
import api from "../../services/api";

export default function CandidaturesPage() {
  const [candidatures, setCandidatures]   = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [userPoste, setUserPoste]         = useState(null);
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const LIMIT = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const poste = u?.poste || null;
      setUserPoste(poste);
      try {
        const params = poste ? `?poste=${encodeURIComponent(poste)}` : "";
        const res = await api.get(`/candidatures/my${params}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setCandidatures(data);
        setFiltered(data);
      } catch {
        setCandidatures([]);
        setFiltered([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const f = candidatures.filter(c =>
      getName(c).toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q) ||
      getEmail(c).toLowerCase().includes(q)
    );
    setFiltered(f);
    setPage(1);
  }, [search, candidatures]);

  // Structure réelle : extracted.parsed.nom / email / telephone (à la racine de parsed)
  const getParsed = (c) => c.extracted?.parsed || c.extracted?.manual || {};

  const getName = (c) => {
    const p = getParsed(c);
    // 1. nom direct dans parsed (ex: "Yosr Joulek")
    if (p.nom) return p.nom;
    // 2. personalInfoForm
    if (c.personalInfoForm?.prenom && c.personalInfoForm?.nom)
      return `${c.personalInfoForm.prenom} ${c.personalInfoForm.nom}`;
    // 3. first_name + last_name dans parsed
    const prenom = p.first_name || p.prenom || p.personal_info?.first_name || "";
    const nom    = p.last_name  || p.personal_info?.last_name  || "";
    if (prenom || nom) return `${prenom} ${nom}`.trim();
    return "—";
  };

  const getEmail = (c) => {
    const p = getParsed(c);
    return c.personalInfoForm?.email || p.email || p.personal_info?.email || "—";
  };

  const getPhone = (c) => {
    const p = getParsed(c);
    return c.personalInfoForm?.telephone || p.telephone || p.phone || p.personal_info?.telephone || "—";
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const withApiPrefix = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const getCvLink = (c) => {
    if (c.cv?.fileUrl)  return withApiPrefix(c.cv.fileUrl);
    if (c.cv?.filename) return `${API_URL}/uploads/cvs/${c.cv.filename}`;
    if (c.cv?.path)     return withApiPrefix(c.cv.path);
    return null;
  };

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Mes candidatures</h1>
              {userPoste && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-green-600 dark:text-emerald-400" />
                  <p className="text-xs font-semibold text-green-700 dark:text-emerald-400">{userPoste}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{filtered.length} candidature(s)</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                           text-sm text-gray-900 dark:text-white placeholder-gray-400 w-56
                           focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">

          {/* Empty */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-600 dark:text-gray-300">Aucune candidature trouvée</p>
              {search && <p className="text-sm text-gray-400 mt-1">Aucun résultat pour « {search} »</p>}
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/50">
                    {[
                      { label: "#"          },
                      { label: "Candidat",   icon: UserCircle },
                      { label: "Poste",      icon: Briefcase  },
                      { label: "Email",      icon: Mail       },
                      { label: "Téléphone",  icon: Phone      },
                      { label: "CV"          },
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
                  {paginated.map((c, idx) => {
                    const name     = getName(c);
                    const email    = getEmail(c);
                    const phone    = getPhone(c);
                    const cvLink   = getCvLink(c);
                    const jobTitle = c.jobTitle || "—";

                    return (
                      <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">

                        <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                          {(page - 1) * LIMIT + idx + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">
                                {(name || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{name}</p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold
                                           bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300">
                            {jobTitle}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 max-w-[200px]">
                          <span className="truncate block">{email}</span>
                        </td>

                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {phone}
                        </td>

                        <td className="px-5 py-4">
                          {cvLink ? (
                            <a href={cvLink} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-600
                                         text-green-700 dark:text-emerald-400 text-xs font-semibold
                                         hover:bg-green-600 hover:text-white dark:hover:bg-emerald-600 transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                              Voir CV
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)}
                    </span> sur <span className="font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center
                                 text-gray-500 hover:bg-green-600 hover:text-white hover:border-green-600
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === "..." ? (
                        <span key={`e${i}`} className="text-gray-400 px-1 text-xs">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            p === page
                              ? "bg-green-600 text-white"
                              : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}>{p}</button>
                      ))}
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center
                                 text-gray-500 hover:bg-green-600 hover:text-white hover:border-green-600
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}