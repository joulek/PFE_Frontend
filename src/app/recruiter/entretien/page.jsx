"use client";

import { useEffect, useMemo, useState } from "react";
import { getCandidaturesWithJob } from "../../services/candidature.api";
import Pagination from "../../components/Pagination";
import { Search, Send } from "lucide-react";

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

function getFullName(c) {
  return safeStr(c?.extracted?.manual?.nom) || safeStr(c?.fullName) || "Candidat";
}

function getEmail(c) {
  return safeStr(c?.extracted?.manual?.email) || safeStr(c?.personalInfoForm?.email) || "";
}

function cleanEmail(email) {
  return safeStr(email).replace(/envel\S*/gi, "").trim();
}

function getCvUrl(c) {
  const raw = safeStr(c?.cv?.fileUrl);
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return `${API_BASE}${raw}`;
}

/* ================= PAGE ================= */
export default function CandidaturesTablePage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [fiches, setFiches] = useState([]);
  const [loadingFiches, setLoadingFiches] = useState(false);

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

    return candidatures.filter((c) => {
      const name = getFullName(c).toLowerCase();
      const email = cleanEmail(getEmail(c)).toLowerCase();
      const job = safeStr(c?.jobTitle).toLowerCase();

      return name.includes(query) || email.includes(query) || job.includes(query);
    });
  }, [candidatures, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function openFicheModal(c) {
    setSelectedCandidature(c);
    setOpenModal(true);
    setLoadingFiches(true);

    try {
      const res = await fetch(`${API_BASE}/fiches`);
      const data = await res.json();
      setFiches(Array.isArray(data) ? data : []);
    } finally {
      setLoadingFiches(false);
    }
  }

  function closeFicheModal() {
    setOpenModal(false);
    setSelectedCandidature(null);
    setFiches([]);
  }

  async function sendFiche(ficheId) {
    if (!selectedCandidature) return;

    const candidatureId = selectedCandidature._id;
    const email = cleanEmail(getEmail(selectedCandidature));

    if (!email) return alert("Email introuvable");

    await fetch(`${API_BASE}/candidatures/${candidatureId}/send-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ficheId, email }),
    });

    alert("Fiche envoyée");
    closeFicheModal();
  }

  return (
    <div className="min-h-screen px-6 py-10
                    bg-[#F0FAF0] dark:bg-zinc-950">

      <h1 className="text-4xl font-extrabold mb-6
                     text-gray-900 dark:text-white">
        Liste des candidatures
      </h1>

      {/* SEARCH */}
      <div className="rounded-full px-5 py-3 flex gap-3 mb-8
                      bg-white dark:bg-zinc-900
                      border border-gray-200 dark:border-zinc-700">
        <Search className="text-green-700 dark:text-green-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher..."
          className="w-full outline-none bg-transparent
                     text-gray-900 dark:text-gray-200"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-3xl shadow overflow-hidden
                      bg-white dark:bg-zinc-900
                      border border-gray-200 dark:border-zinc-700">

        <table className="w-full text-sm">
          <thead className="bg-[#E9F5E3] dark:bg-green-900/30
                             text-green-700 dark:text-green-300">
            <tr>
              <th className="px-6 py-4 text-left">Candidat</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Poste</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-right">CV</th>
              <th className="px-6 py-4 text-right">Fiche</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-gray-500 dark:text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c._id}
                    className="border-t border-gray-200 dark:border-zinc-800">

                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {getFullName(c)}
                  </td>

                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {cleanEmail(getEmail(c)) || "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {c.jobTitle}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {formatDate(c.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {getCvUrl(c) && (
                      <a
                        href={getCvUrl(c)}
                        target="_blank"
                        className="underline text-green-700 dark:text-green-400"
                      >
                        Voir CV
                      </a>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openFicheModal(c)}
                      className="inline-flex items-center gap-2
                                 bg-green-600 hover:bg-green-700
                                 dark:bg-green-700 dark:hover:bg-green-600
                                 text-white px-4 py-2 rounded-full"
                    >
                      <Send size={16} />
                      Envoyer fiche
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* MODAL DARK READY */}
      {openModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50
                        bg-black/40 dark:bg-black/70">
          <div className="bg-white dark:bg-zinc-900
                          border border-gray-200 dark:border-zinc-700
                          rounded-3xl p-6 w-full max-w-md">

            <h2 className="text-xl font-extrabold mb-4
                           text-gray-900 dark:text-white">
              Choisir la fiche
            </h2>

            {loadingFiches ? (
              <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
            ) : (
              <div className="space-y-3">
                {fiches.map((f) => (
                  <button
                    key={f._id}
                    onClick={() => sendFiche(f._id)}
                    className="w-full rounded-full py-2 font-bold
                               bg-[#E9F5E3] dark:bg-green-900/40
                               text-green-700 dark:text-green-300"
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={closeFicheModal}
              className="mt-5 w-full underline text-sm
                         text-gray-500 dark:text-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
