"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandidaturesWithJob } from "../../services/candidature.api";
import Pagination from "../../components/Pagination";
import { Search } from "lucide-react";

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
<div className="max-w-full mx-auto px-6 pt-10 pb-16">        {/* HEADER */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
          Liste des Candidatures
        </h1>

        {/* SEARCH */}
        <div className="bg-white rounded-full shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-3 mb-8">
          <Search className="w-5 h-5 text-[#4E8F2F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, job)…"
            className="w-full outline-none text-sm text-gray-700"
          />
        </div>

        {/* ================= MOBILE : CARDS ================= */}
        <div className="md:hidden space-y-4">
          {paginated.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-3xl shadow-lg border border-[#E9F5E3] p-5"
            >
              <div className="font-extrabold text-gray-900">
                {getFullName(c)}
              </div>

              <div className="text-sm text-gray-700">{getEmail(c)}</div>
              <div className="text-sm text-gray-700">{getPhone(c)}</div>

              {getLinkedIn(c) && (
                <a
                  href={getLinkedIn(c)}
                  target="_blank"
                  className="text-sm underline text-[#4E8F2F]"
                >
                  Profil LinkedIn
                </a>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]">
                  {safeStr(c?.jobTitle)}
                </span>

                {getCvUrl(c) && (
                  <a
                    href={getCvUrl(c)}
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-[#E9F5E3] border border-[#d7ebcf] text-[#4E8F2F] font-bold px-4 py-2 rounded-full"
                  >
                    Voir CV
                  </a>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {formatDate(c?.createdAt)}
              </div>
            </div>
          ))}
        </div>

        {/* ================= DESKTOP : TABLE (INCHANGÉE) ================= */}
        <div className="hidden md:block bg-white rounded-4xl shadow-lg overflow-visible">
          <div className="overflow-x-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
                <tr>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Candidat
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Email
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Contact
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Linkedin
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Poste
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold uppercase text-xs">
                    Date de candidature
                  </th>
                  <th className="text-right px-8 py-5 font-extrabold uppercase text-xs">
                    CV
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-8 text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr key={c._id} className="hover:bg-green-50/40 transition">
                      <td className="px-8 py-5 font-extrabold text-gray-900">
                        {getFullName(c)}
                      </td>
                      <td className="px-8 py-5">{getEmail(c)}</td>
                      <td className="px-8 py-5">{getPhone(c)}</td>
                      <td className="px-8 py-5">
                        {getLinkedIn(c) ? (
                          <a
                            href={getLinkedIn(c)}
                            target="_blank"
                            className="underline"
                          >
                            Profil
                          </a>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]">
                          {safeStr(c?.jobTitle)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-600">
                        {formatDate(c?.createdAt)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {getCvUrl(c) && (
                          <a
                            href={getCvUrl(c)}
                            target="_blank"
                            className="inline-flex items-center gap-2 bg-[#E9F5E3] border border-[#d7ebcf] text-[#4E8F2F] font-bold px-4 py-2 rounded-full"
                          >
                            Voir CV
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-8 py-5 flex items-center justify-between text-sm text-gray-500">
            <p>Total: {filtered.length} candidature(s)</p>

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
