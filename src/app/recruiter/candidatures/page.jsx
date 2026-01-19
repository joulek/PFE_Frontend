"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandidaturesWithJob } from "../../services/candidature.api";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/* ================= EXTRACT HELPERS ================= */
// يرجع object متاع المرشح حسب structure اللي تجيك
function getCandidateObj(c) {
  // حالات ممكنة:
  // 1) c.extracted = {...}
  // 2) c.parsed = {...}
  // 3) c.extracted.extracted = {...}
  return c?.extracted?.extracted || c?.extracted || c?.parsed || {};
}

function getFullName(c) {
  const obj = getCandidateObj(c);

  const prenom =
    safeStr(c?.prenom) ||
    safeStr(obj?.prenom) ||
    safeStr(obj?.first_name);

  const nom =
    safeStr(c?.nom) ||
    safeStr(obj?.nom) ||
    safeStr(obj?.last_name);

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

    // array of primitive
    if (value.every((x) => typeof x === "string" || typeof x === "number")) {
      return value.join(", ");
    }

    return `${value.length} élément(s)`;
  }

  if (isObject(value)) return "Objet";
  return String(value);
}

function JsonFields({ data, level = 0 }) {
  if (data === null || data === undefined) {
    return <p className="text-gray-400 text-sm">—</p>;
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-gray-400 text-sm">—</p>;

    return (
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <p className="text-xs text-gray-500 mb-2 font-semibold">
              Élément #{idx + 1}
            </p>
            <JsonFields data={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Object
  if (isObject(data)) {
    const entries = Object.entries(data);

    if (entries.length === 0) {
      return <p className="text-gray-400 text-sm">—</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, value]) => {
          const isNested = isObject(value) || Array.isArray(value);

          return (
            <div
              key={key}
              className={`bg-green-50 rounded-2xl p-4 ${
                isNested ? "md:col-span-2" : ""
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{niceLabel(key)}</p>

              {!isNested ? (
                <p className="font-semibold text-gray-800 break-words">
                  {renderValue(value)}
                </p>
              ) : (
                <div className="mt-2">
                  <JsonFields data={value} level={level + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Primitive
  return (
    <p className="font-semibold text-gray-800 break-words">
      {renderValue(data)}
    </p>
  );
}

/* ================= MODAL DETAILS ================= */
function DetailsModal({ open, onClose, candidature }) {
  if (!open || !candidature) return null;

  const obj = getCandidateObj(candidature);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Détails candidature
            </h2>
            <p className="text-sm text-gray-500">
              {getFullName(candidature)} • {getEmail(candidature)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            Fermer
          </button>
        </div>

        <div className="border-t border-gray-100 my-4" />

        {/* ✅ JSON كامل يتحول champs */}
        <JsonFields data={obj} />
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function CandidaturesTablePage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // search
  const [q, setQ] = useState("");

  // modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
                Liste des Candidatures
            </h1>
           
          </div>

          {/* SEARCH + REFRESH */}
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email, job)..."
              className="w-full md:w-80 bg-white border border-gray-200
                         rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/40"
            />

            <button
              onClick={loadCandidatures}
              className="bg-[#6CB33F] hover:bg-[#4E8F2F]
                         text-white px-5 py-3 rounded-xl
                         font-semibold shadow transition"
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
                <tr>
                  <th className="text-left px-6 py-4 font-bold">Candidat</th>
                  <th className="text-left px-6 py-4 font-bold">Email</th>
                  <th className="text-left px-6 py-4 font-bold">Job</th>
                  <th className="text-left px-6 py-4 font-bold">Postulée</th>
                  <th className="text-left px-6 py-4 font-bold">Détails</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500" colSpan={5}>
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500" colSpan={5}>
                      Aucune candidature trouvée.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c._id} className="hover:bg-green-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">
                          {getFullName(c)}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {String(c._id).slice(-6)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {getEmail(c)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full
                                         bg-[#E9F5E3] text-[#4E8F2F] text-xs font-semibold">
                          {safeStr(c?.jobTitle) || "Job inconnu"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(c.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelected(c);
                            setDetailsOpen(true);
                          }}
                          className="text-[#4E8F2F] font-semibold hover:underline"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && (
          <p className="text-xs text-gray-500 mt-4">
            Total : {filtered.length} candidature(s)
          </p>
        )}
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
