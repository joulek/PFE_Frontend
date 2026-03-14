"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidaturesWithJob } from "../../services/candidature.api";
import { getSpontaneousApplications } from "../../services/application.api";
import Pagination from "../../components/Pagination";
import {
  Search,
  FileText,
  Linkedin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Briefcase,
  GraduationCap,
  Users,
} from "lucide-react";

/* ================= CONFIG ================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/**
 * ✅ Toutes les données sont dans extracted.parsed (structure unique)
 * Le backend résout déjà fullName / email / telephone / linkedin
 * dans les agrégats MongoDB et les retourne à la racine du document.
 * Ces helpers lisent d'abord les champs résolus par le backend,
 * puis tombent sur extracted.parsed en fallback.
 */
function getParsed(c) {
  return c?.extracted?.parsed || {};
}

function getFullName(c) {
  const p = getParsed(c);
  return (
    safeStr(c?.fullName) ||
    safeStr(c?.prenom && c?.nom ? `${c.prenom} ${c.nom}`.trim() : "") ||
    safeStr(p?.nom) ||
    safeStr(p?.full_name) ||
    safeStr(p?.personal_info?.full_name) ||
    "Candidat"
  );
}

function getEmail(c) {
  const p = getParsed(c);
  return (
    safeStr(c?.email) ||
    safeStr(p?.email) ||
    safeStr(p?.personal_info?.email) ||
    ""
  );
}

function getPhone(c) {
  const p = getParsed(c);
  return (
    safeStr(c?.telephone) ||
    safeStr(p?.telephone) ||
    safeStr(p?.personal_info?.telephone) ||
    safeStr(p?.personal_info?.phone) ||
    ""
  );
}

function getLinkedIn(c) {
  const p = getParsed(c);
  const url =
    safeStr(c?.linkedin) ||
    safeStr(p?.reseaux_sociaux?.linkedin) ||
    safeStr(p?.personal_info?.linkedin) ||
    "";
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function getCvUrl(c) {
  const raw =
    safeStr(c?.cv?.fileUrl) ||
    safeStr(c?.cv?.url) ||
    safeStr(c?.cv?.filename) ||
    safeStr(c?.cvUrl);
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return `${API_BASE}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function getPoste(c) {
  return (
    // Candidatures d'offres : titre de l'offre liée
    safeStr(c?.jobOffer?.titre) ||
    safeStr(c?.job?.titre) ||
    safeStr(c?.offer?.titre) ||
    safeStr(c?.jobTitle) ||
    // Candidatures spontanées
    safeStr(c?.posteRecherche) ||
    safeStr(c?.poste) ||
    "—"
  );
}

/* ================= STATUS BADGE ================= */
const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    dot: "bg-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  },
  VU: {
    label: "Vu",
    dot: "bg-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  },
  RETENU: {
    label: "Retenu",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
  },
  REJETE: {
    label: "Rejeté",
    dot: "bg-red-400",
    bg: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ================= TABS ================= */
const TABS = [
  { key: "TOUS", label: "Tous", Icon: Users },
  { key: "OFFRES", label: "Offres", Icon: Briefcase },
  { key: "RECRUTEMENT", label: "Candidature spontané", Icon: Briefcase },
  { key: "STAGE", label: "Stages", Icon: GraduationCap },
];

/* ================= PAGE ================= */
export default function CandidaturesUnifiedPage() {
  const router = useRouter();
  const [candidaturesOffres, setCandidaturesOffres] = useState([]);
  const [candidaturesSpontanees, setCandidaturesSpontanees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("TOUS");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [offresRes, spontRes] = await Promise.all([
          getCandidaturesWithJob().catch(() => ({ data: [] })),
          getSpontaneousApplications().catch(() => ({ data: [] })),
        ]);
        setCandidaturesOffres(
          (offresRes.data || []).map((c) => ({ ...c, _source: "OFFRES" }))
        );
        setCandidaturesSpontanees(
          (spontRes.data || []).map((c) => ({
            ...c,
            _source: c.type === "STAGIAIRE" ? "STAGE" : "RECRUTEMENT",
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allCandidatures = useMemo(
    () => [...candidaturesOffres, ...candidaturesSpontanees],
    [candidaturesOffres, candidaturesSpontanees]
  );

  const counts = useMemo(
    () => ({
      TOUS: allCandidatures.length,
      OFFRES: candidaturesOffres.length,
      RECRUTEMENT: candidaturesSpontanees.filter((c) => c._source === "RECRUTEMENT").length,
      STAGE: candidaturesSpontanees.filter((c) => c._source === "STAGE").length,
    }),
    [allCandidatures, candidaturesOffres, candidaturesSpontanees]
  );

  const filtered = useMemo(() => {
    let base =
      activeTab === "TOUS"
        ? allCandidatures
        : activeTab === "OFFRES"
          ? candidaturesOffres
          : candidaturesSpontanees.filter((c) => c._source === activeTab);

    const query = q.toLowerCase().trim();
    if (!query) return base;

    return base.filter(
      (c) =>
        getFullName(c).toLowerCase().includes(query) ||
        getEmail(c).toLowerCase().includes(query) ||
        getPoste(c).toLowerCase().includes(query)
    );
  }, [allCandidatures, candidaturesOffres, candidaturesSpontanees, activeTab, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleTabChange(key) {
    setActiveTab(key);
    setPage(1);
  }

  const showStatus = activeTab !== "OFFRES";
  const showSource = activeTab === "TOUS";
  const showLinkedIn = activeTab === "TOUS" || activeTab === "OFFRES";
  const showAction = activeTab !== "OFFRES";

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* HEADER */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
          Liste des Candidatures
        </h1>

        {/* SEARCH */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border
                  ${active
                    ? "bg-[#6CB33F] border-[#6CB33F] text-white shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#6CB33F] dark:hover:border-emerald-500"
                  }`}
              >
                <Icon size={15} />
                {label}
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                  ${active ? "bg-white/25 text-white" : "bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400"}`}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400">Chargement des candidatures...</p>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#4E8F2F] dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {q ? "Aucun résultat" : "Aucune candidature"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {q ? `Aucun résultat pour "${q}".` : "Aucune candidature dans cette catégorie."}
              </p>
              {q && (
                <button onClick={() => setQ("")}
                  className="px-6 py-2 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold transition-colors">
                  Effacer la recherche
                </button>
              )}
            </div>
          </div>
        )}

        {/* MOBILE CARDS */}
        {!loading && filtered.length > 0 && (
          <div className="md:hidden space-y-4">
            {paginated.map((c) => (
              <div key={c._id} className="bg-white dark:bg-gray-800 rounded-3xl shadow border border-[#E9F5E3] dark:border-gray-700 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="font-extrabold text-gray-900 dark:text-white text-lg">{getFullName(c)}</div>
                  {c.status && <StatusBadge status={c.status} />}
                </div>

                {getEmail(c) && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" /> {getEmail(c)}
                  </div>
                )}
                {getPhone(c) && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" /> {getPhone(c)}
                  </div>
                )}
                {getLinkedIn(c) && (
                  <a href={getLinkedIn(c)} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#4E8F2F] dark:text-emerald-400 underline flex items-center gap-1 mb-2">
                    <Linkedin size={14} className="flex-shrink-0" /> Profil LinkedIn
                  </a>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-semibold">
                    {getPoste(c)}
                  </span>
                  {showSource && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      c._source === "OFFRES" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                      : c._source === "STAGE" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      {c._source === "OFFRES" ? "Offre" : c._source === "STAGE" ? "Stage" : "Spontanée"}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(c?.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getCvUrl(c) && (
                      <a href={getCvUrl(c)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-[#E9F5E3] dark:bg-gray-700 border border-[#d7ebcf] dark:border-gray-600 text-[#4E8F2F] dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full text-xs hover:bg-[#d7ebcf] transition-colors">
                        Voir CV
                      </a>
                    )}
                    {c._source !== "OFFRES" && (
                      <button onClick={() => router.push(`/recruiter/candidatures/${c._id}`)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Eye size={14} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!loading && filtered.length > 0 && (
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Candidat</th>
                    <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Email</th>
                    <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Contact</th>
                    {showLinkedIn && (
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">LinkedIn</th>
                    )}
                    <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Poste</th>
                    {showSource && (
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Type</th>
                    )}
                    {showStatus && (
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Statut</th>
                    )}
                    <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Date</th>
                    <th className="text-center px-6 py-5 font-extrabold uppercase text-xs tracking-wider">CV</th>
                    {showAction && (
                      <th className="text-center px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((c) => (
                    <tr key={c._id} className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors">

                      {/* NOM */}
                      <td className="px-6 py-5 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        {getFullName(c)}
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-300">
                        {getEmail(c) || "—"}
                      </td>

                      {/* TÉLÉPHONE */}
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {getPhone(c) || "—"}
                      </td>

                      {/* LINKEDIN */}
                      {showLinkedIn && (
                        <td className="px-6 py-5">
                          {getLinkedIn(c) ? (
                            <a href={getLinkedIn(c)} target="_blank" rel="noopener noreferrer"
                              className="text-[#4E8F2F] dark:text-emerald-400 underline hover:text-[#3a6b23] transition-colors">
                              Profil
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}

                      {/* POSTE */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-semibold border border-[#d7ebcf] dark:border-gray-600 max-w-[320px] whitespace-normal break-words">
                          {getPoste(c)}
                        </span>
                      </td>

                      {/* TYPE */}
                      {showSource && (
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            c._source === "OFFRES" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                            : c._source === "STAGE" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {c._source === "OFFRES" ? <><Briefcase size={11} /> Offre</>
                             : c._source === "STAGE" ? <><GraduationCap size={11} /> Stage</>
                             : "Spontanée"}
                          </span>
                        </td>
                      )}

                      {/* STATUT */}
                      {showStatus && (
                        <td className="px-6 py-5">
                          {c.status ? <StatusBadge status={c.status} /> : <span className="text-gray-400">—</span>}
                        </td>
                      )}

                      {/* DATE */}
                      <td className="px-6 py-5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(c?.createdAt)}
                      </td>

                      {/* CV */}
                      <td className="px-6 py-5 text-center">
                        {getCvUrl(c) ? (
                          <a href={getCvUrl(c)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#E9F5E3] dark:bg-gray-700 border border-[#d7ebcf] dark:border-gray-600 text-[#4E8F2F] dark:text-emerald-400 font-bold px-4 py-2 rounded-full text-xs hover:bg-[#d7ebcf] dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                            Voir CV
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* ACTION */}
                      {showAction && (
                        <td className="px-6 py-5 text-center">
                          {c._source !== "OFFRES" ? (
                            <button onClick={() => router.push(`/recruiter/candidatures/${c._id}`)}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#E9F5E3] dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-[#4E8F2F] transition-colors"
                              title="Voir le détail">
                              <Eye size={15} />
                            </button>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium">
              Total : {filtered.length} candidature{filtered.length > 1 ? "s" : ""}
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

      </div>
    </div>
  );
}