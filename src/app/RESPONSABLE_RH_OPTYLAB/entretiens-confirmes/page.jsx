"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import Pagination from "../../components/Pagination";
import { getConfirmedInterviews } from "../../services/interviewApi.js";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TypeBadge({ type }) {
  const typeMap = {
    rh_technique: { label: "RH + Tech", cls: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300" },
    RH_TECHNIQUE: { label: "RH + Tech", cls: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300" },
    rh: { label: "Entretien RH", cls: "border-[#d7ebcf] bg-[#E9F5E3] text-[#4E8F2F] dark:border-gray-600 dark:bg-gray-700 dark:text-emerald-400" },
    RH: { label: "Entretien RH", cls: "border-[#d7ebcf] bg-[#E9F5E3] text-[#4E8F2F] dark:border-gray-600 dark:bg-gray-700 dark:text-emerald-400" },
    telephonique: { label: "Téléphonique", cls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-300" },
    TELEPHONIQUE: { label: "Téléphonique", cls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-300" },
    technique: { label: "Technique", cls: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/30 dark:text-pink-300" },
    TECHNIQUE: { label: "Technique", cls: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/30 dark:text-pink-300" },
  };

  const t = String(type || "").toLowerCase().trim();
  let config = typeMap[type] || typeMap[t];

  // Fallback intelligent
  if (!config) {
    if (t.includes("rh") && t.includes("tech")) {
      config = typeMap.rh_technique;
    } else if (t.includes("rh")) {
      config = typeMap.rh;
    } else if (t.includes("tel")) {
      config = typeMap.telephonique;
    } else if (t.includes("tech")) {
      config = typeMap.technique;
    } else {
      config = { label: type || "—", cls: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300" };
    }
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${config.cls}`}>
      {config.label}
    </span>
  );
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Confirmé
    </span>
  );
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
        active ? "bg-white/25" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      }`}>{count}</span>
    </button>
  );
}

function CandidateAvatar({ name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {initial}
    </div>
  );
}

/* ══════ GROUPER PAR CANDIDAT ══════ */
function groupInterviewsByCandidate(interviews) {
  const map = new Map();
  const seenIds = new Set();

  for (const iv of interviews) {
    const idStr = String(iv._id);
    if (seenIds.has(idStr)) continue;
    seenIds.add(idStr);

    // Clé de groupe : email + poste
    const key = `${iv.candidateEmail || ""}__${iv.jobTitle || ""}`;

    if (map.has(key)) {
      map.get(key).interviews.push(iv);
    } else {
      map.set(key, {
        key,
        candidateName: iv.candidateName,
        candidateEmail: iv.candidateEmail,
        jobTitle: iv.jobTitle,
        createdAt: iv.createdAt,
        confirmedDate: iv.confirmedDate || iv.proposedDate || iv.createdAt,
        candidatureId: iv.candidatureIdStr || String(iv.candidatureId || iv._id),
        interviews: [iv],
      });
    }
  }

  return Array.from(map.values());
}

export default function ConfirmedInterviewsPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const LIMIT = 5;

  function goToDetails(candidatureId) {
    router.push(`/RESPONSABLE_RH_OPTYLAB/entretiens-confirmes/${candidatureId}`);
  }

  const fetchData = useCallback(
    async (withRefresh = false) => {
      try {
        setError(null);
        if (withRefresh) setRefreshing(true);
        else setLoading(true);

        const data = await getConfirmedInterviews({ page, limit: LIMIT, search });
        setInterviews(data?.interviews || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      } catch (e) {
        setError(e?.response?.data?.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ✅ Grouper les entretiens par candidat
  const groupedInterviews = useMemo(() => groupInterviewsByCandidate(interviews), [interviews]);

  // ✅ Compter par type pour les filtres (sur les groupes)
  const counts = useMemo(() => {
    const all = groupedInterviews.length;
    const rhTech = groupedInterviews.filter((g) =>
      g.interviews.some((i) => {
        const t = String(i.interviewType || "").toLowerCase();
        return t.includes("rh") && t.includes("tech");
      })
    ).length;
    const rh = groupedInterviews.filter((g) =>
      g.interviews.some((i) => {
        const t = String(i.interviewType || "").toLowerCase();
        return t.includes("rh") && !t.includes("tech");
      })
    ).length;
    return { all, rhTech, rh };
  }, [groupedInterviews]);

  // ✅ Filtrer les groupes
  const filteredGroups = useMemo(() => {
    if (activeFilter === "rh") {
      return groupedInterviews.filter((g) =>
        g.interviews.some((i) => {
          const t = String(i.interviewType || "").toLowerCase();
          return t.includes("rh") && !t.includes("tech");
        })
      );
    }
    if (activeFilter === "rh_technique") {
      return groupedInterviews.filter((g) =>
        g.interviews.some((i) => {
          const t = String(i.interviewType || "").toLowerCase();
          return t.includes("rh") && t.includes("tech");
        })
      );
    }
    return groupedInterviews;
  }, [groupedInterviews, activeFilter]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Liste des Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Administration · Vue globale de tous les entretiens confirmés
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => fetchData(true)}
            title="Actualiser"
            className="flex-shrink-0 text-gray-500 hover:text-[#4E8F2F] dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={activeFilter === "all"} label="Tous" count={counts.all} onClick={() => setActiveFilter("all")} />
            <FilterChip active={activeFilter === "rh"} label="RH" count={counts.rh} onClick={() => setActiveFilter("rh")} />
            <FilterChip active={activeFilter === "rh_technique"} label="RH + Tech" count={counts.rhTech} onClick={() => setActiveFilter("rh_technique")} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${filteredGroups.length} résultat${filteredGroups.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des entretiens...</p>
            </div>
          ) : error ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Une erreur est survenue</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
                <button type="button" onClick={() => fetchData(true)}
                  className="mt-2 px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold transition-colors text-sm">
                  Réessayer
                </button>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#4E8F2F] dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aucun entretien trouvé</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">Aucun entretien confirmé ne correspond au filtre actuel.</p>
              </div>
            </div>
          ) : (
            <>
              {/* ══ Desktop ══ */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Candidat</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Poste</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Types d'entretien</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Statut</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Planification</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredGroups.map((group) => (
                      <tr key={group.key} className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors">

                        {/* Candidat */}
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-3">
                            <CandidateAvatar name={group.candidateName} />
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 dark:text-white truncate">{group.candidateName || "—"}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{group.candidateEmail || "—"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Poste */}
                        <td className="px-6 lg:px-8 py-5">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[190px]">{group.jobTitle || "—"}</span>
                          </span>
                        </td>

                        {/* ✅ Types — tous les types du candidat sur une seule ligne */}
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            {group.interviews
                              .filter((iv) => {
                                const t = String(iv.interviewType || "").toLowerCase();
                                return t !== "entretien_nord" && t !== "nord";
                              })
                              .map((iv) => (
                                <TypeBadge key={String(iv._id)} type={iv.interviewType} />
                              ))}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-6 lg:px-8 py-5"><StatusBadge /></td>

                        {/* Planification */}
                        <td className="px-6 lg:px-8 py-5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col gap-2">
                            {group.createdAt && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                                <span>Planifié {formatDate(group.createdAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>Confirmé {formatDate(group.confirmedDate)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 lg:px-8 py-5">
                          <button
                            type="button"
                            onClick={() => goToDetails(group.candidatureId)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ══ Mobile ══ */}
              <div className="grid gap-4 p-4 lg:hidden">
                {filteredGroups.map((group) => (
                  <div key={group.key} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <CandidateAvatar name={group.candidateName} />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate">{group.candidateName || "—"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.candidateEmail || "—"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Poste</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{group.jobTitle || "—"}</span>
                        </div>
                      </div>

                      {/* ✅ Tous les types sur mobile aussi */}
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Types d'entretien</p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.interviews
                            .filter((iv) => {
                              const t = String(iv.interviewType || "").toLowerCase();
                              return t !== "entretien_nord" && t !== "nord";
                            })
                            .map((iv) => (
                              <TypeBadge key={String(iv._id)} type={iv.interviewType} />
                            ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Statut</p>
                        <StatusBadge />
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Planification</p>
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          {group.createdAt && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              <span>Planifié {formatDate(group.createdAt)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Confirmé {formatDate(group.confirmedDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => goToDetails(group.candidatureId)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
                        >
                          <Eye className="w-4 h-4" />
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredGroups.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium">
              Total : <span className="font-extrabold text-gray-700 dark:text-gray-200">{filteredGroups.length}</span> candidat{filteredGroups.length > 1 ? "s" : ""}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => { setPage(newPage); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}