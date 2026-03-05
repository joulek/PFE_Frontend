"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Send,
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Calendar,
  Search,
  Eye,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { getSpontaneousApplications } from "../../services/application.api";
import Pagination from "../../components/Pagination";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ;

// ✅ Normalise l'URL du CV : si relative → ajoute le domaine backend
function getCvUrl(cvUrl) {
  if (!cvUrl) return null;
  if (cvUrl.startsWith("http://") || cvUrl.startsWith("https://")) return cvUrl;
  return `${BACKEND_URL}${cvUrl}`;
}

const TABS = [
  { key: "SPONTANEE", label: "Candidatures spontanées", icon: Send, color: "green" },
  { key: "STAGIAIRE", label: "Stagiaires", icon: GraduationCap, color: "blue" },
];

const STATUS_CONFIG = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700", dot: "bg-amber-400" },
  VU: { label: "Vu", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-700", dot: "bg-blue-400" },
  RETENU: { label: "Retenu", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700", dot: "bg-emerald-400" },
  REJETE: { label: "Rejeté", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-700", dot: "bg-red-400" },
};

export default function SpontaneousListPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("SPONTANEE");
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

  const filtered = useMemo(() => {
    const byType = applications.filter((a) => a.type === activeTab);
    if (!search.trim()) return byType;
    const q = search.toLowerCase();
    return byType.filter(
      (a) =>
        `${a.prenom} ${a.nom}`.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.posteRecherche?.toLowerCase().includes(q)
    );
  }, [applications, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  useEffect(() => setPage(1), [activeTab, search]);

  const counts = useMemo(() => ({
    SPONTANEE: applications.filter((a) => a.type === "SPONTANEE").length,
    STAGIAIRE: applications.filter((a) => a.type === "STAGIAIRE").length,
  }), [applications]);

  const isStage = activeTab === "STAGIAIRE";
  const accentColor = isStage ? "blue" : "green";

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-16">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Candidatures non sollicitées
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les candidatures spontanées et les demandes de stage
          </p>
        </div>

        {/* TABS */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl mb-6 overflow-hidden shadow-sm">
          <div className="flex items-center">
            <div className="px-5 py-3.5 border-r border-gray-100 dark:border-gray-700/60 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Catégorie
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                const Icon = tab.icon;
                const isBlue = tab.color === "blue";
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${
                      active
                        ? isBlue
                          ? "bg-blue-500 text-white"
                          : "bg-[#6CB33F] dark:bg-emerald-600 text-white"
                        : isBlue
                        ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        : "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        active
                          ? "bg-white/25 text-white"
                          : isBlue
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      }`}
                    >
                      {counts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, poste..."
            className="w-full h-11 pl-10 pr-4 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 outline-none transition-colors text-sm"
          />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">Chargement…</div>
        ) : (
          <>
            {/* TABLE HEADER */}
            {filtered.length > 0 && (
              <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 px-5 py-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Candidat</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contact</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Reçue le</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Statut</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Actions</span>
              </div>
            )}

            {/* LIST CONTAINER */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              {paginated.length === 0 ? (
                <div className="p-12 text-center">
                  {isStage ? (
                    <GraduationCap className="mx-auto w-10 h-10 text-gray-300 dark:text-gray-600" />
                  ) : (
                    <Send className="mx-auto w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                  <p className="mt-4 text-gray-400 dark:text-gray-500 text-sm">
                    Aucune candidature trouvée.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((app, idx) => {
                    const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;
                    return (
                      <li
                        key={app._id}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150"
                      >
                        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-3 md:gap-4 items-center">

                          {/* CANDIDAT */}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {app.prenom} {app.nom}
                            </div>
                            {app.posteRecherche && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Briefcase size={11} className="text-gray-400" />
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
                                  {app.posteRecherche}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* CONTACT */}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Mail size={11} className="text-gray-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{app.email}</span>
                            </div>
                            {app.telephone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Phone size={11} className="text-gray-400 shrink-0" />
                                <span>{app.telephone}</span>
                              </div>
                            )}
                          </div>

                          {/* DATE */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar size={11} className="text-gray-400 shrink-0" />
                            <span>{formatDate(app.createdAt)}</span>
                          </div>

                          {/* STATUS */}
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* ACTIONS */}
                          <div className="flex items-center gap-3">
                            {app.cvUrl ? (
                              <a
                                href={getCvUrl(app.cvUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Voir le CV"
                                className="text-[#6CB33F] hover:text-[#4E8F2F] dark:text-emerald-400 transition-colors"
                              >
                                <FileText size={15} />
                              </a>
                            ) : (
                              <span className="w-[15px]" />
                            )}
                            <Link href={`/recruiter/candidatures_spontanees/${app._id}`}>
                              <button
                                className={`h-8 px-4 rounded-full font-semibold text-xs text-white flex items-center gap-1.5 transition-colors ${
                                  isStage
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-[#6CB33F] hover:bg-[#4E8F2F]"
                                }`}
                              >
                                <Eye size={12} />
                                Détails
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

            {/* FOOTER */}
            {filtered.length > 0 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <p className="text-xs">
                  Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> candidature(s) — Page {page} / {totalPages}
                </p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}