"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import api from "../../services/api";

export default function CandidaturesNordPage() {
  const [candidatures, setCandidatures] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoste, setUserPoste] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const LIMIT = 10;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const cleanValue = (value) => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  };

  const getName = (c) => {
    const directFullName = cleanValue(c?.fullName);
    if (directFullName) return directFullName;

    const directCombined = `${cleanValue(c?.prenom)} ${cleanValue(c?.nom)}`.trim();
    if (directCombined) return directCombined;

    const parsed = c?.extracted?.parsed || {};

    const candidates = [
      parsed?.nom,
      parsed?.full_name,
      parsed?.personal_info?.full_name,
      `${cleanValue(parsed?.personal_info?.first_name)} ${cleanValue(parsed?.personal_info?.last_name)}`.trim(),

      parsed?.manual?.nom,
      parsed?.manual?.full_name,
      parsed?.manual?.personal_info?.full_name,
      `${cleanValue(parsed?.manual?.personal_info?.first_name)} ${cleanValue(parsed?.manual?.personal_info?.last_name)}`.trim(),

      parsed?.parsed?.nom,
      parsed?.parsed?.full_name,
      parsed?.parsed?.personal_info?.full_name,
      `${cleanValue(parsed?.parsed?.personal_info?.first_name)} ${cleanValue(parsed?.parsed?.personal_info?.last_name)}`.trim(),
    ];

    const found = candidates.find((value) => cleanValue(value));
    return cleanValue(found) || "—";
  };

  const getEmail = (c) => {
    return (
      cleanValue(c?.email) ||
      cleanValue(c?.extracted?.parsed?.email) ||
      cleanValue(c?.extracted?.parsed?.personal_info?.email) ||
      cleanValue(c?.extracted?.parsed?.manual?.email) ||
      cleanValue(c?.extracted?.parsed?.manual?.personal_info?.email) ||
      cleanValue(c?.extracted?.parsed?.parsed?.email) ||
      cleanValue(c?.extracted?.parsed?.parsed?.personal_info?.email) ||
      "—"
    );
  };

  const getPhone = (c) => {
    return (
      cleanValue(c?.telephone) ||
      cleanValue(c?.phone) ||
      cleanValue(c?.extracted?.parsed?.telephone) ||
      cleanValue(c?.extracted?.parsed?.personal_info?.telephone) ||
      cleanValue(c?.extracted?.parsed?.personal_info?.phone) ||
      cleanValue(c?.extracted?.parsed?.manual?.telephone) ||
      cleanValue(c?.extracted?.parsed?.manual?.personal_info?.telephone) ||
      cleanValue(c?.extracted?.parsed?.manual?.personal_info?.phone) ||
      cleanValue(c?.extracted?.parsed?.parsed?.telephone) ||
      cleanValue(c?.extracted?.parsed?.parsed?.personal_info?.telephone) ||
      cleanValue(c?.extracted?.parsed?.parsed?.personal_info?.phone) ||
      "—"
    );
  };

  const getLinkedin = (c) => {
    return (
      cleanValue(c?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.reseaux_sociaux?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.personal_info?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.manual?.reseaux_sociaux?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.manual?.personal_info?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.parsed?.reseaux_sociaux?.linkedin) ||
      cleanValue(c?.extracted?.parsed?.parsed?.personal_info?.linkedin) ||
      null
    );
  };

  const withApiPrefix = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getCvLink = (c) => {
    if (c?.cv?.fileUrl) return withApiPrefix(c.cv.fileUrl);
    if (c?.cv?.filename) return `${API_URL}/uploads/cvs/${c.cv.filename}`;
    if (c?.cv?.path) return withApiPrefix(c.cv.path);
    return null;
  };

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        setUserPoste(u?.poste || null);
      } catch {
        setUserPoste(null);
      }

      try {
        const res = await api.get("/candidatures/my-created");
        const data = Array.isArray(res.data) ? res.data : [];
        setCandidatures(data);
        setFiltered(data);
      } catch (error) {
        console.error("Erreur chargement candidatures :", error);
        setCandidatures([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();

    const f = candidatures.filter((c) => {
      return (
        getName(c).toLowerCase().includes(q) ||
        (c?.jobTitle || "").toLowerCase().includes(q) ||
        getEmail(c).toLowerCase().includes(q)
      );
    });

    setFiltered(f);
    setPage(1);
  }, [search, candidatures]);

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8f2] dark:bg-[#0f1720] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6fa93f]" />
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8f2] dark:bg-[#0f1720] pb-8">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Liste des Candidatures
          </h1>

          {userPoste && (
            <p className="mt-2 flex items-center gap-2 text-[14px] md:text-[16px] text-[#6b8b4e] dark:text-[#9dca7c]">
              <Briefcase className="w-5 h-5 text-[#6d9f40] dark:text-[#9dca7c] shrink-0" />
              <span>{userPoste}</span>
            </p>
          )}
        </div>

        <div className="mb-7">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher (nom, email, poste)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#d8e3d0] bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#edf4e7] dark:bg-slate-800 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-[#7aa850] dark:text-[#9dca7c]" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Aucune candidature trouvée
              </p>
              {search && (
                <p className="text-sm text-slate-400 mt-1">
                  Aucun résultat pour « {search} »
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        Candidat
                      </th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        Contact
                      </th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        Poste
                      </th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        LinkedIn
                      </th>
                      <th className="text-left px-6 py-5 font-extrabold uppercase text-xs tracking-wider">
                        CV
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginated.map((c, idx) => {
                      const name = getName(c);
                      const email = getEmail(c);
                      const phone = getPhone(c);
                      const linkedin = getLinkedin(c);
                      const cvLink = getCvLink(c);
                      const jobTitle = c?.jobTitle || "—";

                      return (
                        <tr
                          key={c?._id || idx}
                          className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors"
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                           <div className="font-extrabold text-gray-900 dark:text-white text-lg">
                                {name}
                          
                            </div>
                          </td>

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300">
                            {email}
                          </td>

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {phone}
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-[#dce9c8] dark:bg-[#2b3b24] px-4 py-2 text-[15px] font-bold text-[#5d8f35] dark:text-[#b4dc92]">
                              {jobTitle}
                            </span>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            {linkedin ? (
                              <a
                                href={
                                  linkedin.startsWith("http")
                                    ? linkedin
                                    : `https://${linkedin}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a3a] px-5 py-3 text-[15px] font-bold text-[#0a66c2] dark:text-[#70a8ff] hover:opacity-90 transition"
                              >
                                <Linkedin className="w-4 h-4" />
                                Profil
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            {cvLink ? (
                              <a
                                href={cvLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#e4eed8] dark:bg-[#24331f] px-5 py-3 text-[16px] font-bold text-[#5c8d37] dark:text-[#b4dc92] hover:opacity-90 transition"
                              >
                                <FileText className="w-4 h-4" />
                                Voir CV
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-4">
                {paginated.map((c, idx) => {
                  const name = getName(c);
                  const email = getEmail(c);
                  const phone = getPhone(c);
                  const linkedin = getLinkedin(c);
                  const cvLink = getCvLink(c);
                  const jobTitle = c?.jobTitle || "—";

                  return (
                    <div
                      key={c?._id || idx}
                      className="rounded-3xl border border-[#dbe6d3] dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm p-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                    
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white break-words">
                            {name}
                          </h3>

                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-full bg-[#dce9c8] dark:bg-[#2b3b24] px-3 py-1.5 text-[12px] font-bold text-[#5d8f35] dark:text-[#b4dc92]">
                              {jobTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f1f7eb] dark:bg-slate-900 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-[#6d9f40] dark:text-[#9dca7c]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Email
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 break-all">
                              {email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f1f7eb] dark:bg-slate-900 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#6d9f40] dark:text-[#9dca7c]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Contact
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 break-words">
                              {phone}
                            </p>
                          </div>
                        </div>

                        {linkedin && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1e2a3a] flex items-center justify-center shrink-0">
                              <Linkedin className="w-4 h-4 text-[#0a66c2] dark:text-[#70a8ff]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                LinkedIn
                              </p>
                              <a
                                href={
                                  linkedin.startsWith("http")
                                    ? linkedin
                                    : `https://${linkedin}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-[#0a66c2] dark:text-[#70a8ff] font-semibold break-all hover:underline"
                              >
                                Voir le profil
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex gap-2">
                          {cvLink ? (
                            <a
                              href={cvLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e4eed8] dark:bg-[#24331f] px-4 py-3 text-[15px] font-bold text-[#5c8d37] dark:text-[#b4dc92] hover:opacity-90 transition"
                            >
                              <FileText className="w-4 h-4" />
                              Voir CV
                            </a>
                          ) : (
                            <div className="flex-1 inline-flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60 px-4 py-3 text-sm font-semibold text-slate-400">
                              CV indisponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-5 border-t border-[#edf3e8] dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Page {page} sur {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 rounded-full border border-[#d7e3cf] dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="w-10 h-10 rounded-full border border-[#d7e3cf] dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    >
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