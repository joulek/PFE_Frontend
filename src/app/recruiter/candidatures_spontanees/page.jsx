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
} from "lucide-react";
import { getSpontaneousApplications } from "../../services/application.api";
import Pagination from "../../components/Pagination";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

const TABS = [
  { key: "SPONTANEE", label: "Candidatures spontanées", icon: Send, color: "green" },
  { key: "STAGIAIRE", label: "Stagiaires", icon: GraduationCap, color: "blue" },
];

const STATUS_CONFIG = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700" },
  VU: { label: "Vu", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-700" },
  RETENU: { label: "Retenu", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700" },
  REJETE: { label: "Rejeté", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-700" },
};

export default function SpontaneousListPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("SPONTANEE");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

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

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

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
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl mb-8 overflow-hidden shadow-sm">
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
        <div className="relative mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginated.map((app) => {
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;
                return (
                  <div
                    key={app._id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border hover:shadow-lg transition-all duration-200 ${
                      isStage
                        ? "border-blue-100 dark:border-blue-900/40"
                        : "border-emerald-100 dark:border-emerald-900/30"
                    }`}
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {app.prenom} {app.nom}
                        </h3>
                        {app.posteRecherche && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Briefcase size={13} className="text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {app.posteRecherche}
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

                    {/* META */}
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span>{app.email}</span>
                      </div>
                      {app.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span>{app.telephone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Reçue le {formatDate(app.createdAt)}</span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center justify-between mt-5 gap-3">
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#6CB33F] hover:text-[#4E8F2F] dark:text-emerald-400 transition-colors"
                        >
                          <FileText size={14} />
                          Voir le CV
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Pas de CV joint
                        </span>
                      )}

                      <Link href={`/recruiter/candidatures_spontanees/${app._id}`}>
                        <button
                          className={`h-9 px-5 rounded-full font-semibold text-xs text-white flex items-center gap-1.5 transition-colors ${
                            isStage
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-[#6CB33F] hover:bg-[#4E8F2F]"
                          }`}
                        >
                          <Eye size={13} />
                          Voir détails
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
                  {isStage ? (
                    <GraduationCap className="mx-auto w-10 h-10 text-gray-400" />
                  ) : (
                    <Send className="mx-auto w-10 h-10 text-gray-400" />
                  )}
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    Aucune candidature trouvée.
                  </p>
                </div>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <p>Total: {filtered.length} candidature(s) — Page {page} / {totalPages}</p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}