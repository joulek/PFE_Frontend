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

/* ================= DATA HELPERS (ADAPTÉS AU BACKEND) ================= */
function getFullName(c) {
  return (
    safeStr(c?.extracted?.manual?.nom) ||
    safeStr(c?.fullName) ||
    "Candidat"
  );
}

function getEmail(c) {
  return (
    safeStr(c?.extracted?.manual?.email) || // ✅ المصدر الصحيح
    safeStr(c?.personalInfoForm?.email) ||
    ""
  );
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

  /* ===== fiche modal ===== */
  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [fiches, setFiches] = useState([]);
  const [loadingFiches, setLoadingFiches] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getCandidaturesWithJob();

      console.log("RAW RESPONSE FROM API 👇", res);
      console.log("CANDIDATURES DATA 👇", res.data);

      setCandidatures(res.data || []);
      setLoading(false);
    }
    load();
  }, []);

  /* ================= SEARCH ================= */
  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return candidatures;

    return candidatures.filter((c) => {
      const name = getFullName(c).toLowerCase();
      const email = cleanEmail(getEmail(c)).toLowerCase();
      const job = safeStr(c?.jobTitle).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        job.includes(query)
      );
    });
  }, [candidatures, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ================= FICHE ACTIONS ================= */
  async function openFicheModal(c) {
    console.log("SELECTED CANDIDATURE 👇", c);
    console.log("EMAIL FOUND 👇", cleanEmail(getEmail(c)));

    setSelectedCandidature(c);
    setOpenModal(true);
    setLoadingFiches(true);

    try {
      const res = await fetch(`${API_BASE}/fiches`);
      const data = await res.json();
      setFiches(Array.isArray(data) ? data : []);
    } catch {
      alert("Erreur chargement fiches");
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

    if (!email) {
      alert("Email du candidat introuvable");
      console.error("EMAIL NOT FOUND IN:", selectedCandidature);
      return;
    }

    console.log("SEND FICHE PAYLOAD 👇", {
      candidatureId,
      ficheId,
      email,
    });

    try {
      const res = await fetch(
        `${API_BASE}/candidatures/${candidatureId}/send-form`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ficheId, email }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.error("SEND FICHE ERROR:", err);
        alert(err.message || "Erreur backend");
        return;
      }

      alert("Fiche envoyée avec succès");
      closeFicheModal();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l’envoi");
    }
  }

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-[#F0FAF0] px-6 py-10">
      <h1 className="text-4xl font-extrabold mb-6">
        Liste des candidatures
      </h1>

      {/* SEARCH */}
      <div className="bg-white rounded-full px-5 py-3 flex gap-3 mb-8">
        <Search className="text-green-700" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher..."
          className="w-full outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#E9F5E3] text-green-700">
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
                <td colSpan={6} className="px-6 py-8">
                  Chargement...
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="px-6 py-4 font-bold">
                    {getFullName(c)}
                  </td>

                  <td className="px-6 py-4">
                    {cleanEmail(getEmail(c)) || "—"}
                  </td>

                  <td className="px-6 py-4">
                    {c.jobTitle}
                  </td>

                  <td className="px-6 py-4">
                    {formatDate(c.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {getCvUrl(c) && (
                      <a
                        href={getCvUrl(c)}
                        target="_blank"
                        className="underline"
                      >
                        Voir CV
                      </a>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openFicheModal(c)}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full"
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

      {/* MODAL */}
      {openModal && selectedCandidature && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-xl font-extrabold mb-4">
              Choisir la fiche
            </h2>

            {loadingFiches ? (
              <p>Chargement...</p>
            ) : (
              <div className="space-y-3">
                {fiches.map((f) => (
                  <button
                    key={f._id}
                    onClick={() => sendFiche(f._id)}
                    className="w-full bg-[#E9F5E3] text-green-700 py-2 rounded-full font-bold"
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={closeFicheModal}
              className="mt-5 w-full text-gray-500 underline text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
