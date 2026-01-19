"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandidaturesWithJob } from "../../services/candidature.api";
import Pagination from "../../components/Pagination";

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

/* ================= EXTRACT HELPERS ================= */
function getCandidateObj(c) {
  return c?.extracted?.extracted || c?.extracted || c?.parsed || {};
}

function getFullName(c) {
  const obj = getCandidateObj(c);

  const prenom =
    safeStr(c?.prenom) || safeStr(obj?.prenom) || safeStr(obj?.first_name);

  const nom =
    safeStr(c?.nom) || safeStr(obj?.nom) || safeStr(obj?.last_name);

  const full =
    safeStr(obj?.full_name) ||
    safeStr(obj?.nomComplet) ||
    `${prenom} ${nom}`.trim();

  return full || "Candidat";
}

function getEmail(c) {
  const obj = getCandidateObj(c);
  return safeStr(c?.email) || safeStr(obj?.email) || "—";
}

/* ================= JSON -> FIELDS (AUTO) ================= */
function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function niceLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (value.every((x) => typeof x === "string" || typeof x === "number")) {
      return value.join(", ");
    }
    return `${value.length} élément(s)`;
  }

  if (isObject(value)) return "Objet";
  return String(value);
}

/* ================= TAGS COMPONENT ================= */
function TagsList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return "—";

  const cleaned = items
    .map((x) => safeStr(x))
    .filter(Boolean)
    .slice(0, 80);

  if (cleaned.length === 0) return "—";

  return (
    <div className="flex flex-wrap gap-2">
      {cleaned.map((t, idx) => (
        <span
          key={`${t}-${idx}`}
          className="inline-flex items-center px-3 py-1.5 rounded-full
                     bg-white border border-[#d7ebcf]
                     text-[#2f5f1b] text-xs font-semibold"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/* ================= LINKS HELPERS ================= */
function normalizeUrl(url) {
  const u = safeStr(url);
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function isLikelyUrl(s) {
  const v = safeStr(s).toLowerCase();
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.includes("linkedin.com") ||
    v.includes("github.com")
  );
}

function LinkChip({ label, url }) {
  const u = normalizeUrl(url);
  if (!u) return null;

  return (
    <a
      href={u}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                 bg-[#E9F5E3] border border-[#d7ebcf]
                 text-[#2f5f1b] font-semibold text-sm
                 hover:bg-[#dff0d6] transition"
    >
      <span className="text-[11px] tracking-[0.22em] uppercase font-extrabold text-[#4E8F2F]">
        {label}
      </span>
      <span className="text-gray-900 font-semibold truncate max-w-[260px]">
        {u.replace("https://", "").replace("http://", "")}
      </span>
    </a>
  );
}

/* ================= JSON FIELDS ================= */
function JsonFields({ data }) {
  if (data === null || data === undefined) {
    return <p className="text-gray-400 text-sm">—</p>;
  }

  /* ===== ARRAY ===== */
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-gray-400 text-sm">—</p>;

    // ✅ array of primitive => tags
    if (data.every((x) => typeof x === "string" || typeof x === "number")) {
      return <TagsList items={data} />;
    }

    // array of objects => cards
    return (
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-gray-100 p-5"
          >
            <JsonFields data={item} />
          </div>
        ))}
      </div>
    );
  }

  /* ===== OBJECT ===== */
  if (isObject(data)) {
    const entries = Object.entries(data);
    if (entries.length === 0) return <p className="text-gray-400 text-sm">—</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, value]) => {
          const lowerKey = String(key).toLowerCase();
          const isNested = isObject(value) || Array.isArray(value);

          const fullWidthKeys = [
            "description",
            "profil",
            "summary",
            "resume",
            "about",
            "objectif",
            "objectifs",
          ];

          const tagsKeys = [
            "skills",
            "competences",
            "compétences",
            "technologies",
            "tech",
            "tools",
            "outils",
            "frameworks",
            "langages",
            "languages",
            "stack",
            "tags",
          ];

          const isTagsArray =
            Array.isArray(value) &&
            value.every((x) => typeof x === "string" || typeof x === "number") &&
            tagsKeys.includes(lowerKey);

          const isFullWidth =
            fullWidthKeys.includes(lowerKey) || (isNested && !isTagsArray);

          return (
            <div
              key={key}
              className={`bg-[#E9F5E3] rounded-2xl p-5 border border-[#d7ebcf] ${
                isFullWidth ? "md:col-span-2" : ""
              }`}
            >
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#4E8F2F] font-extrabold mb-2">
                {niceLabel(key)}
              </p>

              {!isNested ? (
                isLikelyUrl(value) ? (
                  <a
                    href={normalizeUrl(value)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-gray-900 break-words underline decoration-[#6CB33F]/50 hover:decoration-[#6CB33F]"
                  >
                    {renderValue(value)}
                  </a>
                ) : (
                  <p className="font-semibold text-gray-900 break-words leading-relaxed">
                    {renderValue(value)}
                  </p>
                )
              ) : (
                <div className="mt-2">
                  {isTagsArray ? (
                    <TagsList items={value} />
                  ) : (
                    <JsonFields data={value} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ===== PRIMITIVE ===== */
  return (
    <p className="font-semibold text-gray-900 break-words">
      {renderValue(data)}
    </p>
  );
}

/* ================= MODAL DETAILS ================= */
function DetailsModal({ open, onClose, candidature }) {
  if (!open || !candidature) return null;

  const obj = getCandidateObj(candidature);

  const linkedin =
    obj?.linkedin ||
    obj?.linkedIn ||
    obj?.linkedin_url ||
    obj?.reseaux_sociaux?.linkedin;

  const github =
    obj?.github ||
    obj?.gitHub ||
    obj?.github_url ||
    obj?.reseaux_sociaux?.github;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Détails candidature
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              <span className="text-[#4E8F2F] font-semibold">
                {getFullName(candidature)}
              </span>{" "}
              • {getEmail(candidature)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center
                       bg-white border border-gray-200 text-gray-400
                       hover:text-gray-700 hover:bg-gray-50 transition"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="px-8 py-6 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#E9F5E3] rounded-2xl px-5 py-4 border border-[#d7ebcf]">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#4E8F2F] font-extrabold">
                Téléphone
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {renderValue(obj?.telephone || obj?.phone || obj?.tel)}
              </p>
            </div>

            <div className="bg-[#E9F5E3] rounded-2xl px-5 py-4 border border-[#d7ebcf]">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#4E8F2F] font-extrabold">
                Localisation
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {renderValue(obj?.adresse || obj?.localisation || obj?.location)}
              </p>
            </div>

            <div className="bg-[#E9F5E3] rounded-2xl px-5 py-4 border border-[#d7ebcf]">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#4E8F2F] font-extrabold">
                Postulé le
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {formatDate(candidature?.createdAt)}
              </p>
            </div>

            <div className="bg-[#E9F5E3] rounded-2xl px-5 py-4 border border-[#d7ebcf]">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#4E8F2F] font-extrabold">
                Poste
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {safeStr(candidature?.jobTitle) || "—"}
              </p>
            </div>
          </div>

          {(linkedin || github) && (
            <div className="flex flex-wrap gap-3 mb-8">
              <LinkChip label="LinkedIn" url={linkedin} />
              <LinkChip label="GitHub" url={github} />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-gray-900">
                Informations extraites
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Champs générés automatiquement à partir du CV.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">
              <JsonFields data={obj} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function CandidaturesTablePage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ✅ Pagination
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

  // ✅ reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [q]);

  // ✅ total pages
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // ✅ slice data for current page
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // ✅ avoid page > totalPages
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

          <button
            onClick={loadCandidatures}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F]
                       text-white px-6 py-3 rounded-full
                       font-semibold shadow-md transition flex items-center gap-2"
          >
            ⟳ Actualiser
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-full shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-3 mb-8">
          <span className="text-gray-400">🔍</span>
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
                    Actions
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
                  paginated.map((c) => (
                    <tr key={c._id} className="hover:bg-green-50/40 transition">
                      <td className="px-8 py-5">
                        <div className="font-extrabold text-gray-900">
                          {getFullName(c)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {String(c._id).slice(-6)}
                        </div>
                      </td>

                      <td className="px-8 py-5 text-gray-600">{getEmail(c)}</td>

                      <td className="px-8 py-5">
                        <span
                          className="inline-flex items-center px-4 py-2 rounded-full
                                         bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold border border-[#d7ebcf]"
                        >
                          {safeStr(c?.jobTitle) || "Poste inconnu"}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-gray-600">
                        {formatDate(c.createdAt)}
                      </td>

                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelected(c);
                            setDetailsOpen(true);
                          }}
                          className="text-[#4E8F2F] font-bold hover:underline inline-flex items-center gap-2"
                        >
                          Voir détails <span className="text-lg">›</span>
                        </button>
                      </td>
                    </tr>
                  ))
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

      {/* MODAL */}
      <DetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        candidature={selected}
      />
    </div>
  );
}
