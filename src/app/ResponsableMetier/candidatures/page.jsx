"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  FileText,
  Briefcase,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Linkedin,
  GraduationCap,
  Tag,
  X,
  Building2,
  Eye,
} from "lucide-react";
import api from "../../services/api";

export default function CandidaturesPage() {
  const router = useRouter();

  const [emploiCandidatures, setEmploiCandidatures] = useState([]);
  const [stageCandidatures, setStageCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userPoste, setUserPoste] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("emploi");
  const [selectedJob, setSelectedJob] = useState(null);

  const LIMIT = 10;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const poste = u?.poste || null;
      setUserPoste(poste);

      try {
        const [emploiRes, stageRes] = await Promise.allSettled([
          api.get(`/candidatures/my${poste ? `?poste=${encodeURIComponent(poste)}` : ""}`),
          api.get("/api/applications/my-stage"),
        ]);

        setEmploiCandidatures(
          emploiRes.status === "fulfilled" && Array.isArray(emploiRes.value?.data)
            ? emploiRes.value.data : []
        );
        setStageCandidatures(
          stageRes.status === "fulfilled" && Array.isArray(stageRes.value?.data)
            ? stageRes.value.data : []
        );
      } catch (error) {
        console.error("Erreur chargement :", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => { setPage(1); setSelectedJob(null); }, [activeTab]);
  useEffect(() => { setPage(1); }, [search, selectedJob]);

  const getParsed = (c) => {
    const raw = c?.extracted?.parsed || c?.extracted || {};
    return raw?.manual || raw?.parsed || raw || {};
  };
  const getPI = (c) => getParsed(c)?.personal_info || {};

  const getName = (c) => {
    const p = getParsed(c); const pi = getPI(c);
    if (p?.nom?.trim()) return p.nom.trim();
    if (p?.full_name?.trim()) return p.full_name.trim();
    if (c?.personalInfoForm?.prenom || c?.personalInfoForm?.nom)
      return `${c?.personalInfoForm?.prenom || ""} ${c?.personalInfoForm?.nom || ""}`.trim();
    const full = `${p?.first_name || p?.prenom || pi?.first_name || ""} ${p?.last_name || pi?.last_name || ""}`.trim();
    return full || "—";
  };
  const getEmail = (c) => {
    const p = getParsed(c); const pi = getPI(c);
    return c?.personalInfoForm?.email || p?.email || pi?.email || "—";
  };
  const getPhone = (c) => {
    const p = getParsed(c); const pi = getPI(c);
    return c?.personalInfoForm?.telephone || p?.telephone || p?.phone || pi?.telephone || pi?.phone || "—";
  };
  const getLinkedin = (c) => {
    const p = getParsed(c); const pi = getPI(c);
    const r = p?.reseaux_sociaux || {};
    return c?.personalInfoForm?.linkedin || r?.linkedin || pi?.linkedin || p?.linkedin || "—";
  };
  const normalizeUrl = (url) => {
    if (!url || url === "—") return null;
    const t = String(url).trim();
    return t ? (/^https?:\/\//i.test(t) ? t : `https://${t}`) : null;
  };
  const withApiPrefix = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const getCvLink = (c) => {
    if (c?.cv?.fileUrl) return withApiPrefix(c.cv.fileUrl);
    if (c?.cv?.filename) return `${API_URL}/uploads/cvs/${c.cv.filename}`;
    if (c?.cv?.path) return withApiPrefix(c.cv.path);
    if (c?.cvUrl) return withApiPrefix(c.cvUrl);
    return null;
  };

  const getStageName = (c) =>
    `${c?.prenom || ""} ${c?.nom || ""}`.trim() || "—";

  const emploiJobTitles = useMemo(() =>
    [...new Set(emploiCandidatures.map((c) => c?.jobTitle).filter(Boolean))],
    [emploiCandidatures]
  );
  const stageJobTitles = useMemo(() =>
    [...new Set(stageCandidatures.map((c) => c?.jobTitle).filter(Boolean))],
    [stageCandidatures]
  );
  const activeJobTitles = activeTab === "emploi" ? emploiJobTitles : stageJobTitles;

  const source = activeTab === "emploi" ? emploiCandidatures : stageCandidatures;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return source.filter((c) => {
      const isStage = activeTab === "stage";
      const name = isStage ? getStageName(c).toLowerCase() : getName(c).toLowerCase();
      const email = isStage ? (c?.email || "").toLowerCase() : getEmail(c).toLowerCase();
      const phone = isStage ? (c?.telephone || "").toLowerCase() : getPhone(c).toLowerCase();
      const jobTitle = (c?.jobTitle || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q) || jobTitle.includes(q);
      const matchJob = !selectedJob || c?.jobTitle === selectedJob;
      return matchSearch && matchJob;
    });
  }, [search, source, selectedJob, activeTab]);

  const totalPages = Math.ceil(filtered.length / LIMIT) || 1;
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const statusConfig = {
    EN_ATTENTE: { label: "En attente", bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-400" },
    VU:         { label: "Vu",         bg: "bg-slate-100 dark:bg-slate-700",      text: "text-slate-600 dark:text-slate-300" },
    RETENU:     { label: "Retenu",     bg: "bg-[#dce9c8] dark:bg-[#2b3b24]",     text: "text-[#5d8f35] dark:text-[#b4dc92]" },
    REJETE:     { label: "Refusé",     bg: "bg-red-100 dark:bg-red-900/30",       text: "text-red-700 dark:text-red-400" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8f2] dark:bg-[#0f1720] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6fa93f]" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8f2] dark:bg-[#0f1720] pb-8">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 sm:pt-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            Liste des Candidatures
          </h1>
          {userPoste && (
            <p className="flex items-center gap-2 text-[14px] md:text-[16px] text-[#6b8b4e] dark:text-[#9dca7c]">
              <Briefcase className="w-5 h-5 shrink-0" />
              <span>{userPoste}</span>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("emploi")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "emploi"
                ? "bg-[#4E8F2F] text-white shadow-md shadow-[#4E8F2F]/30"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#d8e3d0] dark:border-slate-700 hover:border-[#4E8F2F]"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Emploi
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === "emploi"
                ? "bg-white/25 text-white"
                : "bg-[#e4f0da] dark:bg-slate-700 text-[#4E8F2F] dark:text-emerald-400"
            }`}>
              {emploiCandidatures.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stage")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "stage"
                ? "bg-[#4E8F2F] text-white shadow-md shadow-[#4E8F2F]/30"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#d8e3d0] dark:border-slate-700 hover:border-[#4E8F2F]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Stage
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === "stage"
                ? "bg-white/25 text-white"
                : "bg-[#e4f0da] dark:bg-slate-700 text-[#4E8F2F] dark:text-emerald-400"
            }`}>
              {stageCandidatures.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-4 transition-colors">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher (nom, email, téléphone, poste)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tags */}
        {activeJobTitles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
              <Tag className="w-3.5 h-3.5" />
              Offre :
            </div>
            {activeJobTitles.map((title) => (
              <button
                key={title}
                onClick={() => setSelectedJob(selectedJob === title ? null : title)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedJob === title
                    ? "bg-[#4E8F2F] text-white border-[#4E8F2F] shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-[#d8e3d0] dark:border-slate-600 hover:border-[#4E8F2F]"
                }`}
              >
                <Building2 className="w-3 h-3" />
                {title}
                {selectedJob === title && <X className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
            {selectedJob && (
              <button
                onClick={() => setSelectedJob(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1 transition"
              >
                Tout afficher
              </button>
            )}
          </div>
        )}

        {/* Count */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
          {filtered.length} candidature{filtered.length > 1 ? "s" : ""}
          {selectedJob ? ` pour « ${selectedJob} »` : ""}
          {search ? ` · recherche "${search}"` : ""}
        </p>

        {/* Table */}
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#d8e3d0] bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#edf4e7] dark:bg-slate-800 flex items-center justify-center mb-3">
                {activeTab === "stage"
                  ? <GraduationCap className="w-6 h-6 text-[#7aa850] dark:text-[#9dca7c]" />
                  : <FileText className="w-6 h-6 text-[#7aa850] dark:text-[#9dca7c]" />
                }
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">Aucune candidature trouvée</p>
              {(search || selectedJob) && (
                <p className="text-sm text-slate-400 mt-1">
                  {search && `Recherche : « ${search} »`}
                  {search && selectedJob && " · "}
                  {selectedJob && `Offre : « ${selectedJob} »`}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Candidat</th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Email</th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Contact</th>
                      {activeTab === "emploi" && (
                        <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">LinkedIn</th>
                      )}
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Offre</th>
                      {activeTab === "stage" && (
                        <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Statut</th>
                      )}
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">CV</th>
                      {/* Colonne Action — stage uniquement */}
                      {activeTab === "stage" && (
                        <th className="text-center px-6 py-5 font-extrabold uppercase text-xs tracking-wider">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginated.map((c, idx) => {
                      const isStage = activeTab === "stage";
                      const name    = isStage ? getStageName(c) : getName(c);
                      const email   = isStage ? (c?.email || "—") : getEmail(c);
                      const phone   = isStage ? (c?.telephone || "—") : getPhone(c);
                      const linkedin = isStage ? null : normalizeUrl(getLinkedin(c));
                      const cvLink  = getCvLink(c);
                      const jobTitle = c?.jobTitle || "—";
                      const st = isStage ? statusConfig[c?.status] : null;
                      const detailId = c?._id?.toString?.() || c?._id;

                      return (
                        <tr key={c?._id || idx} className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors">

                          {/* Candidat */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#edf4e7] dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {isStage
                                  ? <GraduationCap className="w-6 h-6 text-[#6d9f40] dark:text-[#9dca7c]" />
                                  : <UserCircle className="w-7 h-7 text-[#6d9f40] dark:text-[#9dca7c]" />
                                }
                              </div>
                              <span className="text-[18px] font-extrabold text-[#111827] dark:text-white leading-snug">
                                {name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300 break-all">{email}</td>
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{phone}</td>

                          {!isStage && (
                            <td className="px-6 py-5 text-gray-600 dark:text-gray-300">
                              {linkedin ? (
                                <a href={linkedin} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-[#2563eb] dark:text-[#93c5fd] font-semibold hover:underline break-all">
                                  <Linkedin className="w-4 h-4 shrink-0" />
                                  <span className="truncate max-w-[220px]">Profil</span>
                                </a>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                          )}

                          {/* Offre */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-[#dce9c8] dark:bg-[#2b3b24] px-4 py-2 text-[15px] font-bold text-[#5d8f35] dark:text-[#b4dc92]">
                              {jobTitle}
                            </span>
                          </td>

                          {/* Statut */}
                          {isStage && (
                            <td className="px-6 py-5 whitespace-nowrap">
                              {st ? (
                                <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold ${st.bg} ${st.text}`}>
                                  {st.label}
                                </span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                          )}

                          {/* CV */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            {cvLink ? (
                              <a href={cvLink} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#e4eed8] dark:bg-[#24331f] px-5 py-3 text-[16px] font-bold text-[#5c8d37] dark:text-[#b4dc92] hover:opacity-90 transition">
                                <FileText className="w-4 h-4" />
                                Voir CV
                              </a>
                            ) : <span className="text-slate-400">—</span>}
                          </td>

                          {/* ── Action (stage only) ── */}
                          {isStage && (
                            <td className="px-6 py-5 text-center">
                              <button
                                onClick={() => router.push(`/ResponsableMetier/candidatures/${detailId}`)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f1f7eb] dark:bg-slate-800 text-[#6d9f40] dark:text-[#9dca7c] hover:bg-[#dce9c8] dark:hover:bg-slate-700 transition-colors"
                                title="Voir le détail"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden p-4 space-y-4">
                {paginated.map((c, idx) => {
                  const isStage = activeTab === "stage";
                  const name    = isStage ? getStageName(c) : getName(c);
                  const email   = isStage ? (c?.email || "—") : getEmail(c);
                  const phone   = isStage ? (c?.telephone || "—") : getPhone(c);
                  const linkedin = isStage ? null : normalizeUrl(getLinkedin(c));
                  const cvLink  = getCvLink(c);
                  const jobTitle = c?.jobTitle || "—";
                  const st = isStage ? statusConfig[c?.status] : null;
                  const detailId = c?._id?.toString?.() || c?._id;

                  return (
                    <div key={c?._id || idx}
                      className="rounded-3xl border border-[#dbe6d3] dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#edf4e7] dark:bg-slate-900 flex items-center justify-center shrink-0">
                          {isStage
                            ? <GraduationCap className="w-7 h-7 text-[#6d9f40] dark:text-[#9dca7c]" />
                            : <UserCircle className="w-7 h-7 text-[#6d9f40] dark:text-[#9dca7c]" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] font-extrabold text-[#111827] dark:text-white break-words">{name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center rounded-full bg-[#dce9c8] dark:bg-[#2b3b24] px-3 py-1.5 text-[12px] font-bold text-[#5d8f35] dark:text-[#b4dc92]">
                              {jobTitle}
                            </span>
                            {isStage && st && (
                              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold ${st.bg} ${st.text}`}>
                                {st.label}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Bouton détail sur la carte mobile */}
                        {isStage && (
                          <button
                            onClick={() => router.push(`/ResponsableMetier/candidatures/${detailId}`)}
                            className="ml-auto flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f1f7eb] dark:bg-slate-700 text-[#6d9f40] dark:text-[#9dca7c] hover:bg-[#dce9c8] dark:hover:bg-slate-600 transition-colors"
                            title="Voir le détail"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f1f7eb] dark:bg-slate-900 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-[#6d9f40] dark:text-[#9dca7c]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 break-all">{email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f1f7eb] dark:bg-slate-900 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#6d9f40] dark:text-[#9dca7c]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Contact</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{phone}</p>
                          </div>
                        </div>

                        {!isStage && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#f1f7eb] dark:bg-slate-900 flex items-center justify-center shrink-0">
                              <Linkedin className="w-4 h-4 text-[#6d9f40] dark:text-[#9dca7c]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">LinkedIn</p>
                              {linkedin ? (
                                <a href={linkedin} target="_blank" rel="noreferrer"
                                  className="text-sm text-[#2563eb] dark:text-[#93c5fd] break-all hover:underline">
                                  {getLinkedin(c)}
                                </a>
                              ) : <p className="text-sm text-slate-400">—</p>}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          {cvLink ? (
                            <a href={cvLink} target="_blank" rel="noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e4eed8] dark:bg-[#24331f] px-4 py-3 text-[15px] font-bold text-[#5c8d37] dark:text-[#b4dc92] hover:opacity-90 transition">
                              <FileText className="w-4 h-4" />
                              Voir CV
                            </a>
                          ) : (
                            <div className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60 px-4 py-3 text-sm font-semibold text-slate-400">
                              CV indisponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-5 border-t border-[#edf3e8] dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-10 h-10 rounded-full border border-[#d7e3cf] dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 rounded-full border border-[#d7e3cf] dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}