"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Search,
  Eye,
  Briefcase,
} from "lucide-react";
import { getSpontaneousApplications } from "../../services/application.api";
import Pagination from "../../components/Pagination";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "");

function getCvUrl(cvUrl) {
  if (!cvUrl) return null;
  if (cvUrl.startsWith("http://") || cvUrl.startsWith("https://")) return cvUrl;
  return `${BACKEND_URL}${cvUrl}`;
}

const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/25",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700/60",
    dot: "bg-amber-400",
  },
  VU: {
    label: "Vu",
    bg: "bg-blue-100 dark:bg-blue-900/25",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700/60",
    dot: "bg-blue-400",
  },
  RETENU: {
    label: "Retenu",
    bg: "bg-emerald-100 dark:bg-emerald-900/25",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700/60",
    dot: "bg-emerald-400",
  },
  REJETE: {
    label: "Rejeté",
    bg: "bg-red-100 dark:bg-red-900/25",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700/60",
    dot: "bg-red-400",
  },
};

export default function SpontaneousListPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ALL | SPONTANEE | STAGIAIRE
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    getSpontaneousApplications()
      .then((res) => setApplications(res?.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const spont = applications.filter((a) => a.type === "SPONTANEE").length;
    const stag = applications.filter((a) => a.type === "STAGIAIRE").length;
    return {
      ALL: applications.length,
      SPONTANEE: spont,
      STAGIAIRE: stag,
    };
  }, [applications]);

  const filtered = useMemo(() => {
    let byType = applications;

    if (activeFilter !== "ALL") {
      byType = applications.filter((a) => a.type === activeFilter);
    }

    if (!search.trim()) return byType;
    const q = search.toLowerCase();

    return byType.filter((a) => {
      const fullName = `${a.prenom || ""} ${a.nom || ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.posteRecherche?.toLowerCase().includes(q)
      );
    });
  }, [applications, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => setPage(1), [activeFilter, search]);

  const FilterPill = ({ active, onClick, icon, label, count }) => {
    const Icon = icon;
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-extrabold transition-all border
          ${
            active
              ? "bg-[#6CB33F] border-[#6CB33F] text-white shadow-sm shadow-emerald-500/20"
              : "bg-white/70 dark:bg-gray-900/50 border-gray-200/80 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:border-[#6CB33F]/60"
          }`}
      >
        <Icon size={16} />
        {label}
        <span
          className={`ml-1 inline-flex items-center justify-center min-w-7 h-6 px-2 rounded-full text-xs font-extrabold
            ${
              active
                ? "bg-white/20 text-white"
                : "bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/40"
            }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16">
        {/* TITLE */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Liste des Candidatures spontanées
          </h1>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6CB33F] dark:text-emerald-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, job)…"
            className="w-full h-12 pl-12 pr-4 rounded-full border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 outline-none transition-colors text-sm shadow-sm"
          />
        </div>

        {/* FILTERS */}
        <div className="mb-5 sm:mb-6">
          <div className="inline-flex flex-wrap items-center gap-3 rounded-3xl sm:rounded-full border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-2">
            <FilterPill
              active={activeFilter === "ALL"}
              onClick={() => setActiveFilter("ALL")}
              icon={Briefcase}
              label="Tous"
              count={counts.ALL}
            />
            <FilterPill
              active={activeFilter === "SPONTANEE"}
              onClick={() => setActiveFilter("SPONTANEE")}
              icon={Briefcase}
              label="Recrutement"
              count={counts.SPONTANEE}
            />
            <FilterPill
              active={activeFilter === "STAGIAIRE"}
              onClick={() => setActiveFilter("STAGIAIRE")}
              icon={GraduationCap}
              label="Stages"
              count={counts.STAGIAIRE}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            Chargement…
          </div>
        ) : (
          <>
            {/* ============ MOBILE CARDS (<= md) ============ */}
            <div className="md:hidden space-y-4">
              {paginated.length === 0 ? (
                <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-10 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Aucune candidature trouvée.
                  </p>
                </div>
              ) : (
                paginated.map((app) => {
                  const statusCfg =
                    STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;
                  const fullName = `${app.prenom || ""} ${app.nom || ""}`.trim();
                  const jobTitle = app.posteRecherche || "—";

                  return (
                    <div
                      key={app._id}
                      className="rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.35)] overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-extrabold text-gray-900 dark:text-white truncate">
                              {fullName || "—"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {app.email || "—"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {app.telephone || "—"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {app.cvUrl ? (
                              <a
                                href={getCvUrl(app.cvUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-extrabold
                                  bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#2F6E1F] dark:text-emerald-200
                                  border border-emerald-200/70 dark:border-emerald-900/40"
                              >
                                Voir CV
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                —
                              </span>
                            )}

                            <Link
                              href={`/recruiter/candidatures_spontanees/${app._id}`}
                            >
                              <button
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full
                                  border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900"
                                title="Détails"
                              >
                                <Eye className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                              </button>
                            </Link>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-3 py-2 text-xs font-extrabold
                              bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#2F6E1F] dark:text-emerald-200
                              border border-emerald-200/70 dark:border-emerald-900/40 max-w-full"
                          >
                            <span className="truncate">{jobTitle}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          {formatDate(app.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ============ DESKTOP TABLE (>= md) ============ */}
            <div className="hidden md:block">
              <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.35)] overflow-hidden">
                {/* HEADER */}
                <div className="bg-[#E9F5E3] dark:bg-gray-900 border-b border-emerald-200/70 dark:border-gray-800">
                  <div className="grid grid-cols-[1.3fr_2fr_1.3fr_2fr_1fr_1fr_0.9fr_0.7fr] gap-6 px-8 py-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Candidat
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Email
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Contact
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Poste
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Status
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300">
                      Date
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300 text-right">
                      CV
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-300 text-right">
                      Action
                    </span>
                  </div>
                </div>

                {/* BODY */}
                {paginated.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Aucune candidature trouvée.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginated.map((app) => {
                      const statusCfg =
                        STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;

                      const fullName = `${app.prenom || ""} ${app.nom || ""}`.trim();
                      const jobTitle = app.posteRecherche || "—";

                      return (
                        <li
                          key={app._id}
                          className="bg-white/60 dark:bg-gray-950/10 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="grid grid-cols-[1.3fr_2fr_1.3fr_2fr_1fr_1fr_0.9fr_0.7fr] gap-6 px-8 py-6 items-center">
                            <div className="font-extrabold text-gray-900 dark:text-white">
                              {fullName || "—"}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {app.email || "—"}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {app.telephone || "—"}
                            </div>

                            <div className="flex items-center min-w-0">
                              <span
                                className="inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold
                                  bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#2F6E1F] dark:text-emerald-200
                                  border border-emerald-200/70 dark:border-emerald-900/40 max-w-full"
                              >
                                <span className="truncate">{jobTitle}</span>
                              </span>
                            </div>

                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                                />
                                {statusCfg.label}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(app.createdAt)}
                            </div>

                            <div className="flex items-center justify-end">
                              {app.cvUrl ? (
                                <a
                                  href={getCvUrl(app.cvUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-extrabold
                                    bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#2F6E1F] dark:text-emerald-200
                                    border border-emerald-200/70 dark:border-emerald-900/40
                                    hover:bg-[#DDF0D3] dark:hover:bg-emerald-950/60 transition-colors"
                                >
                                  Voir CV
                                </a>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  —
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end">
                              <Link
                                href={`/recruiter/candidatures_spontanees/${app._id}`}
                              >
                                <button
                                  className="inline-flex items-center justify-center h-10 w-10 rounded-full
                                    border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900
                                    hover:border-[#6CB33F]/60 dark:hover:border-emerald-600 transition-colors"
                                  title="Détails"
                                >
                                  <Eye className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
              <p className="text-xs">
                Total:{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {filtered.length}
                </span>{" "}
                candidatures
              </p>
              {filtered.length > pageSize && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}