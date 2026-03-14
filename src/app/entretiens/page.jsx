"use client";
// app/entretiens/page.jsx — DGA uniquement — navigation vers page détails

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  X,
  UserCheck,
  Mail,
  CheckCircle,
  Eye,
} from "lucide-react";
import Pagination from "../components/Pagination";
import {
  getDgaMyInterviews,
  confirmDgaInterview,
} from "../services/candidature.api";

/* ══════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════ */
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t) {
  if (!t) return "—";
  if (typeof t === "string" && t.includes(":")) return t.slice(0, 5);
  return new Date(t).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

/* ══════════════════════════════════════════════════════════════════
 * Small UI
 * ══════════════════════════════════════════════════════════════════ */
function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function DgaBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 whitespace-nowrap">
      Entretien Direction
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * PAGE PRINCIPALE
 * ══════════════════════════════════════════════════════════════════ */
const LIMIT = 15;
const TABLE_HEADERS = [
  "Candidat",
  "Poste",
  "Date DGA",
  "Heure",
  "Lieu",
  "Responsable RH",
  "Statut",
  "Actions",
];

export default function EntretiensPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [confirmError, setConfirmError] = useState("");

  const handleConfirmDGA = async (e, interviewId) => {
    e.stopPropagation();
    if (!interviewId) return;

    const currentInterview = interviews.find(
      (iv) => String(iv._id) === String(interviewId)
    );

    if (!currentInterview || currentInterview.dgaConfirmed || confirming) return;

    try {
      setConfirmError("");
      setConfirming(interviewId);

      const res = await confirmDgaInterview(interviewId);

      if (res?.success || res?.alreadyConfirmed || res?.dgaConfirmed) {
        setInterviews((prev) =>
          prev.map((iv) =>
            String(iv._id) === String(interviewId)
              ? {
                  ...iv,
                  dgaConfirmed: true,
                  status:
                    iv.status === "DGA_CONFIRMED"
                      ? iv.status
                      : "DGA_CONFIRMED",
                }
              : iv
          )
        );
      }
    } catch (err) {
      console.error("Erreur confirmation DGA:", err);
      setConfirmError(
        err?.response?.data?.message || "Erreur lors de la confirmation."
      );
    } finally {
      setConfirming(null);
    }
  };

  const fetchData = useCallback(
    async (withRefresh = false) => {
      try {
        setError(null);
        if (withRefresh) setRefreshing(true);
        else setLoading(true);

        const data = await getDgaMyInterviews({
          page,
          limit: LIMIT,
          search,
        });

        setInterviews(data?.interviews || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      } catch (e) {
        setError(e?.response?.data?.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRowClick = (iv) => {
    const id = iv.candidatureId || String(iv._id);
    router.push(`/entretiens/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Mes Entretiens
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Les entretiens planifiés avec la Direction Générale.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6">
          <Search className="w-5 h-5 text-[#4E8F2F] flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="flex-shrink-0 text-gray-500 hover:text-[#4E8F2F] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {confirmError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {confirmError}
          </div>
        )}

        <div className="text-sm font-medium text-gray-500 mb-4">
          {!loading && `${total} résultat${total > 1 ? "s" : ""}`}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
              <p className="text-sm text-gray-500">Chargement des entretiens...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Une erreur est survenue</h2>
              <p className="text-gray-600 max-w-md">{error}</p>
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold text-sm"
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && interviews.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <h2 className="text-xl font-bold">Aucun entretien trouvé</h2>
              <p className="text-gray-600">
                Aucun entretien Direction n'a encore été planifié pour vous.
              </p>
            </div>
          )}

          {!loading && !error && interviews.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "1100px" }}
                >
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      {TABLE_HEADERS.map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-5 font-extrabold uppercase text-xs tracking-wider whitespace-nowrap border-b border-green-100 dark:border-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {interviews.map((iv, idx) => {
                      const dga = iv.dgaInterview;
                      const date = dga?.date || iv.confirmedDate;
                      const time = dga?.time || iv.confirmedTime;
                      const lieu = dga?.location || iv.location;
                      const id = iv.candidatureId || String(iv._id);
                      const interviewId = String(iv._id);
                      const isConfirmed = !!iv.dgaConfirmed;
                      const isLoadingConfirm = confirming === interviewId;

                      return (
                        <tr
                          key={String(iv._id)}
                          onClick={() => handleRowClick(iv)}
                          className={`${
                            idx % 2 !== 0 ? "bg-gray-50/60 dark:bg-gray-800" : "dark:bg-gray-800"
                          } hover:bg-[#F0FAF0] dark:hover:bg-gray-700/40 transition-colors border-t border-gray-100 dark:border-gray-700/50 cursor-pointer`}
                        >
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <Avatar name={iv.candidateName} />
                              <div className="min-w-0">
                                <p className="font-extrabold text-gray-900 dark:text-white truncate max-w-[160px]">
                                  {iv.candidateName || "—"}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[160px] flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                  {iv.candidateEmail || ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[160px]">
                                {iv.jobTitle || "—"}
                              </span>
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              {formatDate(date)}
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              {formatTime(time)}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {lieu || "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {iv.responsableName || iv.responsableEmail ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#E9F5E3] dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                  <UserCheck className="w-3.5 h-3.5 text-[#4E8F2F]" />
                                </div>
                                <div className="min-w-0">
                                  {iv.responsableName && (
                                    <p className="font-semibold text-xs truncate max-w-[120px]">
                                      {iv.responsableName}
                                    </p>
                                  )}
                                  {iv.responsableEmail && (
                                    <p className="text-[11px] text-gray-400 truncate max-w-[120px] flex items-center gap-1">
                                      <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                      {iv.responsableEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <DgaBadge />
                          </td>

                          <td
                            className="px-4 py-4 align-middle"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(`/entretiens/${id}`)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 hover:border-[#4E8F2F] hover:bg-[#E9F5E3] px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#4E8F2F] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Voir
                              </button>

                              {isConfirmed ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Confirmé
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleConfirmDGA(e, interviewId)}
                                  disabled={isLoadingConfirm || isConfirmed}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  {isLoadingConfirm ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Confirmer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {interviews.map((iv) => {
                  const dga = iv.dgaInterview;
                  const date = dga?.date || iv.confirmedDate;
                  const time = dga?.time || iv.confirmedTime;
                  const id = iv.candidatureId || String(iv._id);
                  const interviewId = String(iv._id);
                  const isConfirmed = !!iv.dgaConfirmed;
                  const isLoadingConfirm = confirming === interviewId;

                  return (
                    <div
                      key={String(iv._id)}
                      onClick={() => router.push(`/entretiens/${id}`)}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm cursor-pointer hover:border-[#4E8F2F] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar name={iv.candidateName} />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-gray-900 dark:text-white truncate">
                            {iv.candidateName || "—"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {iv.candidateEmail || "—"}
                          </p>
                        </div>
                        <DgaBadge />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          {iv.jobTitle || "—"}
                        </div>

                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          {formatDate(date)}
                          <Clock className="w-4 h-4 text-gray-400 ml-2" />
                          {formatTime(time)}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-bold text-[#4E8F2F] flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Voir le dossier →
                          </span>

                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmé
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleConfirmDGA(e, interviewId)}
                              disabled={isLoadingConfirm || isConfirmed}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {isLoadingConfirm ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Confirmer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={LIMIT}
                onChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}