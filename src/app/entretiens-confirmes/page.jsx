"use client";
// app/entretiens-confirmes/page.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Calendar,
  Search,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  X,
  UserCheck,
  Mail,
} from "lucide-react";
import api from "../services/api";

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
  if (typeof t === "string" && t.includes(":")) return t;
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

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function TypeBadge({ type }) {
  const isRhTech =
    type === "rh_technique" || type === "RH + Tech" || type === "rh+tech";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${
        isRhTech
          ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
          : "border-[#d7ebcf] bg-[#E9F5E3] text-[#4E8F2F] dark:border-gray-600 dark:bg-gray-700 dark:text-emerald-400"
      }`}
    >
      {isRhTech ? "RH + Tech" : "Entretien RH"}
    </span>
  );
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Confirmé
    </span>
  );
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className="opacity-70">{count}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className={colorClass}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, limit, onChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600 dark:text-gray-300">
          {from}–{to}
        </span>{" "}
        sur{" "}
        <span className="font-semibold text-gray-600 dark:text-gray-300">
          {total}
        </span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="text-gray-400 px-1 text-xs">
                …
              </span>
            ) : (
              <button
                type="button"
                key={p}
                onClick={() => onChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  p === page
                    ? "bg-[#4E8F2F] text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {p}
              </button>
            ),
          )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white hover:border-[#4E8F2F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function groupByCandidate(interviews) {
  const map = new Map();
  for (const iv of interviews) {
    const key = iv.candidateEmail || iv.candidateName || String(iv._id);
    if (!map.has(key)) {
      map.set(key, {
        candidateName: iv.candidateName,
        candidateEmail: iv.candidateEmail,
        items: [],
      });
    }
    map.get(key).items.push(iv);
  }
  return Array.from(map.values());
}

/* ══════════════════════════════════════════════════════════════ */
export default function ConfirmedInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const LIMIT = 15;

  const fetchData = useCallback(
    async (withRefresh = false) => {
      try {
        setError(null);
        if (withRefresh) setRefreshing(true);
        else setLoading(true);
        const params = new URLSearchParams({ page, limit: LIMIT });
        if (search.trim()) params.set("search", search.trim());
        const { data } = await api.get(
          `/api/interviews/confirmed-exclude-rh-nord?${params}`,
        );
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
    [page, search],
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

  const counts = useMemo(
    () => ({
      all: interviews.length,
      rhTech: interviews.filter(
        (i) =>
          i.interviewType === "rh_technique" || i.interviewType === "RH + Tech",
      ).length,
      rh: interviews.filter(
        (i) =>
          i.interviewType !== "rh_technique" && i.interviewType !== "RH + Tech",
      ).length,
    }),
    [interviews],
  );

  const filteredInterviews = useMemo(() => {
    if (activeFilter === "rh")
      return interviews.filter(
        (i) =>
          i.interviewType !== "rh_technique" && i.interviewType !== "RH + Tech",
      );
    if (activeFilter === "rh_technique")
      return interviews.filter(
        (i) =>
          i.interviewType === "rh_technique" || i.interviewType === "RH + Tech",
      );
    return interviews;
  }, [interviews, activeFilter]);

  // Grouper par candidat puis aplatir avec rowspan
  const groups = groupByCandidate(filteredInterviews);
  const uniqueCandidates = groups.length;
  const rows = [];
  let groupIdx = 0;
  groups.forEach((group) => {
    group.items.forEach((iv, ivIdx) => {
      rows.push({
        iv,
        isFirst: ivIdx === 0,
        rowspan: group.items.length,
        candidateName: group.candidateName,
        candidateEmail: group.candidateEmail,
        groupIdx,
      });
    });
    groupIdx++;
  });

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* En-tête */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Liste des Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {loading
                ? "Chargement..."
                : `${total} entretien${total > 1 ? "s" : ""} · ${uniqueCandidates} candidat${uniqueCandidates > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-4 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
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
            title="Actualiser"
            className="flex-shrink-0 text-gray-500 hover:text-[#4E8F2F] dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={activeFilter === "all"}
              label="Tous"
              count={counts.all}
              onClick={() => setActiveFilter("all")}
            />
            <FilterChip
              active={activeFilter === "rh"}
              label="RH"
              count={counts.rh}
              onClick={() => setActiveFilter("rh")}
            />
            <FilterChip
              active={activeFilter === "rh_technique"}
              label="RH + Tech"
              count={counts.rhTech}
              onClick={() => setActiveFilter("rh_technique")}
            />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading
              ? "…"
              : `${filteredInterviews.length} résultat${filteredInterviews.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {/* ── Chargement ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chargement des entretiens...
              </p>
            </div>
          )}

          {/* ── Erreur ── */}
          {!loading && error && (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Une erreur est survenue
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => fetchData(true)}
                  className="mt-2 px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold transition-colors text-sm"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* ── Vide ── */}
          {!loading && !error && rows.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#4E8F2F] dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Aucun entretien trouvé
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun entretien confirmé ne correspond au filtre actuel.
                </p>
              </div>
            </div>
          )}

          {/* ── Tableau desktop ── */}
          {!loading && !error && rows.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "1180px" }}
                >
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      {[
                        "Candidat",
                        "Poste",
                        "Date",
                        "Heure",
                        "Lieu",
                        "Type",
                        "Responsable",
                        "ResponsableRH",
                        "Statut",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider whitespace-nowrap border-b border-[#d7ebcf] dark:border-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const {
                        iv,
                        isFirst,
                        rowspan,
                        candidateName,
                        candidateEmail,
                        groupIdx: gi,
                      } = row;
                      const date = iv.confirmedDate || iv.proposedDate;
                      const time = iv.confirmedTime || iv.proposedTime;
                      const isRhTech =
                        iv.interviewType === "rh_technique" ||
                        iv.interviewType === "RH + Tech";
                      const topBorder = isFirst
                        ? "border-t-2 border-[#c8e6bc] dark:border-gray-600"
                        : "border-t border-gray-100 dark:border-gray-700/50";

                      return (
                        <tr
                          key={String(iv._id)}
                          className={` hover:bg-green-50/50 dark:hover:bg-gray-700/30 transition-colors`}
                        >
                          {isFirst && (
                            <td
                              rowSpan={rowspan}
                              className={`px-6 lg:px-8 py-4 align-middle border-r border-gray-100 dark:border-gray-700 ${topBorder}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                  <p className="font-extrabold text-gray-900 dark:text-white truncate max-w-[160px]">
                                    {candidateName || "—"}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                                    {candidateEmail || ""}
                                  </p>
                                  {rowspan > 1 && (
                                    <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-[#E9F5E3] text-[#4E8F2F] text-[10px] font-bold border border-[#d7ebcf]">
                                      {rowspan} entretiens
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Poste */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[190px]">
                                {iv.jobTitle || "—"}
                              </span>
                            </span>
                          </td>

                          {/* Date */}
                          <td
                            className={`px-6 lg:px-8 py-5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ${topBorder}`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
                              <span>{formatDate(date)}</span>
                            </div>
                          </td>

                          {/* Heure */}
                          <td
                            className={`px-6 lg:px-8 py-5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ${topBorder}`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{formatTime(time)}</span>
                            </div>
                          </td>

                          {/* Lieu */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {iv.location || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            <TypeBadge type={iv.interviewType} />
                          </td>

                          {/* Responsable */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            {(iv.responsableName || iv.responsableEmail) &&
                            iv.responsableEmail !== iv.candidateEmail ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isRhTech ? "bg-violet-100 dark:bg-violet-900/30" : "bg-[#E9F5E3] dark:bg-emerald-900/30"}`}
                                >
                                  <UserCheck
                                    className={`w-3.5 h-3.5 ${isRhTech ? "text-violet-600 dark:text-violet-400" : "text-[#4E8F2F] dark:text-emerald-400"}`}
                                  />
                                </div>
                                <div className="min-w-0">
                                  {iv.responsableName && (
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate max-w-[140px]">
                                      {iv.responsableName}
                                    </p>
                                  )}
                                  {iv.responsableEmail && (
                                    <p className="text-[11px] text-gray-400 truncate max-w-[140px] flex items-center gap-1">
                                      <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                      {iv.responsableEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-600">
                                —
                              </span>
                            )}
                          </td>

                          {/* ✅ ResponsableRH */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            {iv.recruiterName || iv.recruiterEmail ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 dark:bg-blue-900/30">
                                  <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  {iv.recruiterName && (
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate max-w-[140px]">
                                      {iv.recruiterName}
                                    </p>
                                  )}
                                  {iv.recruiterEmail && (
                                    <p className="text-[11px] text-gray-400 truncate max-w-[140px] flex items-center gap-1">
                                      <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                      {iv.recruiterEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-600">
                                —
                              </span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className={`px-6 lg:px-8 py-5 ${topBorder}`}>
                            <StatusBadge />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Cartes mobile ── */}
              <div className="grid gap-4 p-4 lg:hidden">
                {filteredInterviews.map((iv, idx) => {
                  const date = iv.confirmedDate || iv.proposedDate;
                  const time = iv.confirmedTime || iv.proposedTime;
                  const isRhTech =
                    iv.interviewType === "rh_technique" ||
                    iv.interviewType === "RH + Tech";
                  return (
                    <div
                      key={String(iv._id)}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar name={iv.candidateName} />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-gray-900 dark:text-white truncate">
                            {iv.candidateName || "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {iv.candidateEmail || "—"}
                          </p>
                        </div>
                        <TypeBadge type={iv.interviewType} />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{iv.jobTitle || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-[#4E8F2F]" />
                          <span>{formatDate(date)}</span>
                          <Clock className="w-4 h-4 text-gray-400 ml-2" />
                          <span>{formatTime(time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{iv.location || "—"}</span>
                        </div>
                        {(iv.responsableName || iv.responsableEmail) && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <UserCheck
                              className={`w-4 h-4 flex-shrink-0 ${isRhTech ? "text-violet-500" : "text-[#4E8F2F]"}`}
                            />
                            <div className="min-w-0">
                              {iv.responsableName && (
                                <span className="font-semibold text-xs">
                                  {iv.responsableName}
                                </span>
                              )}
                              {iv.responsableEmail && (
                                <p className="text-[11px] text-gray-400 truncate">
                                  {iv.responsableEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {/* ✅ ResponsableRH mobile */}
                        {(iv.recruiterName || iv.recruiterEmail) && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            <div className="min-w-0">
                              {iv.recruiterName && (
                                <span className="font-semibold text-xs">
                                  {iv.recruiterName}
                                </span>
                              )}
                              {iv.recruiterEmail && (
                                <p className="text-[11px] text-gray-400 truncate">
                                  {iv.recruiterEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="pt-1">
                          <StatusBadge />
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
