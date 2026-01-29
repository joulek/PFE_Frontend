"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandidaturesWithJob } from "../../services/candidature.api";
import Pagination from "../../components/Pagination";
import { Search, FileText } from "lucide-react";

/* ================= CONFIG (.env) ================= */
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

/* ================= FULL NAME ================= */
function getFullName(c) {
  const extracted = c?.extracted || {};
  const parsed = c?.parsed || {};

  return (
    safeStr(c?.fullName) ||
    safeStr(extracted?.manual?.nom) ||
    safeStr(parsed?.manual?.nom) ||
    `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim() ||
    "Candidat"
  );
}

/* ================= EMAIL ================= */
function getEmail(c) {
  const extracted = c?.extracted || {};
  const parsed = c?.parsed || {};

  const e =
    safeStr(c?.email) ||
    safeStr(extracted?.manual?.email) ||
    safeStr(parsed?.manual?.email) ||
    safeStr(extracted?.email);

  return e || "";
}

/* ================= CONTACT ================= */
function getPhone(c) {
  return (
    safeStr(c?.personalInfoForm?.telephone) ||
    safeStr(c?.extracted?.parsed?.telephone) ||
    ""
  );
}

/* ================= LINKEDIN ================= */
function getLinkedIn(c) {
  const url =
    safeStr(c?.personalInfoForm?.linkedin) ||
    safeStr(c?.extracted?.parsed?.reseaux_sociaux?.linkedin);

  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://${url}`;
}

/* ================= CV ================= */
function normalizeUrl(raw) {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return `${API_BASE}/${raw}`;
}

function getCvUrl(c) {
  const raw =
    safeStr(c?.cv?.fileUrl) ||
    safeStr(c?.cv?.url) ||
    safeStr(c?.cv?.filename);

  return normalizeUrl(raw);
}

/* ================= PAGE ================= */
export default function CandidaturesTablePage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getCandidaturesWithJob();
      setCandidatures(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return candidatures;

    return candidatures.filter(
      (c) =>
        getFullName(c).toLowerCase().includes(query) ||
        getEmail(c).toLowerCase().includes(query) ||
        safeStr(c?.jobTitle).toLowerCase().includes(query)
    );
  }, [candidatures, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-[#F0FAF0]">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* HEADER */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
          Liste des Candidatures
        </h1>

        {/* SEARCH */}
        <div className="bg-white rounded-full shadow-sm border border-gray-100 px-4 sm:px-5 py-3 flex items-center gap-3 mb-8">
          <Search className="w-5 h-5 text-[#4E8F2F] flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, job)…"
            className="w-full outline-none text-sm text-gray-700"
          />
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] border-t-[#4E8F2F]"></div>
              <p className="text-gray-500 text-lg">Chargement des candidatures...</p>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#E9F5E3] flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#4E8F2F]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {q ? "Aucun résultat trouvé" : "Aucune candidature"}
              </h2>
              <p className="text-gray-600 max-w-md">
                {q
                  ? `Aucune candidature ne correspond à votre recherche "${q}".`
                  : "Il n'y a actuellement aucune candidature dans le système."}
              </p>
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="mt-4 px-6 py-3 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold transition-colors"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= MOBILE : CARDS ================= */}
        {!loading && filtered.length > 0 && (
          <div className="md:hidden space-y-4">
            {paginated.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-3xl shadow-lg border border-[#E9F5E3] p-5"
              >
                <div className="font-extrabold text-gray-900 text-lg mb-2">
                  {getFullName(c)}
                </div>

                {getEmail(c) && (
                  <div className="text-sm text-gray-700 mb-1">
                    📧 {getEmail(c)}
                  </div>
                )}

                {getPhone(c) && (
                  <div className="text-sm text-gray-700 mb-1">
                    📱 {getPhone(c)}
                  </div>
                )}

                {getLinkedIn(c) && (
                  <a
                    href={getLinkedIn(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline text-[#4E8F2F] hover:text-[#3a6b23] block mb-3"
                  >
                    🔗 Profil LinkedIn
                  </a>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]">
                    {safeStr(c?.jobTitle) || "Poste non spécifié"}
                  </span>

                  {getCvUrl(c) && (
                    <a
                      href={getCvUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#E9F5E3] border border-[#d7ebcf] text-[#4E8F2F] font-bold px-4 py-2 rounded-full hover:bg-[#d7ebcf] transition-colors"
                    >
                      Voir CV
                    </a>
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  📅 {formatDate(c?.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= DESKTOP : TABLE ================= */}
        {!loading && filtered.length > 0 && (
          <div className="hidden md:block bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
                  <tr>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Candidat
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Linkedin
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Poste
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      CV
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginated.map((c) => (
                    <tr key={c._id} className="hover:bg-green-50/40 transition">
                      <td className="px-6 lg:px-8 py-5 font-extrabold text-gray-900">
                        {getFullName(c)}
                      </td>
                      <td className="px-6 lg:px-8 py-5 text-gray-700">
                        {getEmail(c) || "—"}
                      </td>
                      <td className="px-6 lg:px-8 py-5 text-gray-700">
                        {getPhone(c) || "—"}
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        {getLinkedIn(c) ? (
                          <a
                            href={getLinkedIn(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4E8F2F] underline hover:text-[#3a6b23]"
                          >
                            Profil
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]">
                          {safeStr(c?.jobTitle) || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 lg:px-8 py-5 text-gray-600">
                        {formatDate(c?.createdAt)}
                      </td>
                      <td className="px-6 lg:px-8 py-5 text-right">
                        {getCvUrl(c) ? (
                          <a
                            href={getCvUrl(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#E9F5E3] border border-[#d7ebcf] text-[#4E8F2F] font-bold px-4 py-2 rounded-full hover:bg-[#d7ebcf] transition-colors"
                          >
                            Voir CV
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p className="font-medium">
              Total: {filtered.length} candidature{filtered.length > 1 ? "s" : ""}
            </p>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}