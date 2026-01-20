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

/* ================= FULL NAME (EXTRACTED FIRST) ================= */
function getFullName(c) {
  const extracted = c?.extracted || {};
  const parsed = c?.parsed || {};

  const full =
    safeStr(c?.fullName) ||
    safeStr(extracted?.manual?.nom) ||
    safeStr(extracted?.nom) ||
    safeStr(parsed?.manual?.nom) ||
    safeStr(parsed?.nom) ||
    safeStr(extracted?.full_name) ||
    safeStr(parsed?.full_name) ||
    safeStr(extracted?.personal_info?.full_name) ||
    safeStr(parsed?.personal_info?.full_name) ||
    `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();

  return full || "Candidat";
}
/* ================= EMAIL (EXTRACTED FIRST) ================= */
function getEmail(c) {
  const extracted = c?.extracted || {};
  const parsed = c?.parsed || {};

  const e =
    safeStr(c?.email) ||
    safeStr(extracted?.manual?.email) ||  // ← AJOUTEZ CETTE LIGNE
    safeStr(extracted?.email) ||
    safeStr(parsed?.manual?.email) ||     // ← AJOUTEZ CETTE LIGNE
    safeStr(parsed?.email) ||
    safeStr(extracted?.personal_info?.email) ||
    safeStr(parsed?.personal_info?.email);

  if (!e) return "—";

  return e.replace(/[^\w.@+-]/g, "") || "—";
}

/* ================= CV URL HELPERS ================= */
function normalizeUrl(raw) {
  const u = safeStr(raw);
  if (!u) return "";

  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  if (/^[a-zA-Z]:\\/.test(u)) return "";

  if (u.startsWith("/")) return `${API_BASE}${u}`;

  return `${API_BASE}/${u}`;
}

function getCvUrl(c) {
  let raw =
    safeStr(c?.cv?.fileUrl) ||
    safeStr(c?.cv?.url) ||
    safeStr(c?.cv?.filename) ||
    safeStr(c?.cv?.path) ||
    "";

  // ✅ si le backend renvoie /uploads/xxx.pdf on corrige vers /uploads/cvs/xxx.pdf
  if (raw.startsWith("/uploads/") && !raw.startsWith("/uploads/cvs/")) {
    raw = raw.replace("/uploads/", "/uploads/cvs/");
  }

  return normalizeUrl(raw);
}


/* ================= PAGE ================= */
export default function CandidaturesTablePage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadCandidatures() {
    try {
      setLoading(true);
      const res = await getCandidaturesWithJob();
      setCandidatures(res.data || []);
    } catch (err) {
      console.error("loadCandidatures error:", err);
      setCandidatures([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidatures();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return candidatures;

    return candidatures.filter((c) => {
      const fullName = getFullName(c).toLowerCase();
      const email = getEmail(c).toLowerCase();
      const jobTitle = safeStr(c?.jobTitle).toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        jobTitle.includes(query)
      );
    });
  }, [candidatures, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-[#F0FAF0]">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Liste des Candidatures
          </h1>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-full shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-3 mb-8">
          <Search className="w-5 h-5 text-[#4E8F2F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, job)…"
            className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
                <tr>
                  <th className="text-left px-8 py-5 font-extrabold tracking-wide uppercase text-xs">
                    Candidat
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold tracking-wide uppercase text-xs">
                    Email
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold tracking-wide uppercase text-xs">
                    Poste
                  </th>
                  <th className="text-left px-8 py-5 font-extrabold tracking-wide uppercase text-xs">
                    Date de candidature
                  </th>
                  <th className="text-right px-8 py-5 font-extrabold tracking-wide uppercase text-xs">
                    CV
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-8 py-8 text-gray-500" colSpan={5}>
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-8 py-8 text-gray-500" colSpan={5}>
                      Aucune candidature trouvée.
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => {
                    const cvUrl = getCvUrl(c);
                    const email = getEmail(c);

                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-green-50/40 transition"
                      >
                        {/* CANDIDAT */}
                        <td className="px-8 py-5">
                          <div className="font-extrabold text-gray-900">
                            {getFullName(c)}
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="px-8 py-5 text-gray-700">
                          {email !== "—" ? (
                            <a
                              href={`mailto:${email}`}
                              className="underline decoration-[#6CB33F]/50 hover:decoration-[#6CB33F]"
                            >
                              {email}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* POSTE */}
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]">
                            {safeStr(c?.jobTitle) || "Poste inconnu"}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="px-8 py-5 text-gray-600">
                          {formatDate(c?.createdAt)}
                        </td>

                        {/* CV */}
                        <td className="px-8 py-5 text-right">
                          {cvUrl ? (
                            <a
                              href={cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-[#E9F5E3] border border-[#d7ebcf] text-[#4E8F2F] font-bold px-4 py-2 rounded-full hover:bg-[#dff0d6] transition"
                            >
                              Voir CV
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
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
    </div>
  );
}
