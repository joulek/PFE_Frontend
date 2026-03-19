"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  CheckCircle2,
  XCircle,
  X,
  Users,
  ChevronLeft,

} from "lucide-react";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

// ─────────────────────────────────────────────────────────
//  Composants
// ─────────────────────────────────────────────────────────
function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────
export default function ConfirmedCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 10;
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchConfirmed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        status: "CONFIRMED",
      });
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const res = await api.get(`/api/interviewNord/interview-nord/list?${params}`);
      const list = res.data?.interviews || [];

      // Filtrer uniquement les confirmés (sécurité côté front)
      const confirmed = list.filter((iv) => iv.status === "CONFIRMED");

      setCandidates(confirmed);
      setTotal(res.data?.total || confirmed.length);
      setTotalPages(res.data?.totalPages || Math.ceil(confirmed.length / LIMIT) || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchConfirmed(); }, [fetchConfirmed]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">

        {/* ── En-tête ── */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Candidats Confirmés
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Liste des entretiens confirmés par RH Nord
              </p>
            </div>
          </div>

          {/* Compteur */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              {loading ? "…" : `${total} confirmé${total > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 mb-6 shadow-sm transition-colors">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, poste)..."
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Chargement ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Chargement des candidats confirmés...</p>
            </div>
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">Erreur de chargement</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              <button
                onClick={fetchConfirmed}
                className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm hover:bg-[#4E8F2F] transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Vide ── */}
        {!loading && !error && candidates.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">Aucun candidat confirmé</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {search ? "Aucun résultat pour cette recherche." : "Aucun entretien confirmé pour le moment."}
              </p>
            </div>
          </div>
        )}

        {/* ── Tableau ── */}
        {!loading && !error && candidates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["Candidat", "Poste", "Statut"].map((h) => (
                      <th key={h} className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {candidates.map((iv) => {
                    return (
                      <tr
                        key={iv._id}
                        className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        {/* Candidat */}
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={iv.candidateName} />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm">
                                {iv.candidateName || "—"}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {iv.candidateEmail || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Poste */}
                        <td className="px-6 lg:px-8 py-5 w-[350px]">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[300px]">{iv.jobTitle || "—"}</span>
                          </span>
                        </td>

                        {/* Statut */}
                        <td className="px-6 lg:px-8 py-5">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Confirmé
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && candidates.length > 0 && totalPages > 1 && (
          <div className="mt-6 sm:mt-8 px-3 sm:px-4 md:px-8 py-4 sm:py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">
              Page {page} sur {totalPages} — Total : {total} candidat{total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >← Préc.</button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-xs sm:text-sm transition-colors ${
                    p === page
                      ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >{p}</button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >Suiv. →</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}