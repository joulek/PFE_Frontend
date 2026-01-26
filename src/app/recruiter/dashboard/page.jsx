"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getJobCount,
  getJobsWithCandidatureCount,
} from "../../services/job.api";
import {
  getCondidatureCount,
  getCandidaturesWithJob,
} from "../../services/candidature.api";

// ✅ Icons modernes
import { Briefcase, Users } from "lucide-react";

// ✅ Chart (Recharts)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ================= UTILS ================= */
function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/* ================= NAME GUESS (same as candidatures page) ================= */
function guessNameFromFilename(c) {
  const file = safeStr(c?.cv?.originalName || "");
  if (!file) return "";

  const noExt = file.replace(/\.(pdf|docx|doc)$/i, "");

  const cleaned = noExt
    .replace(/^cv[-_ ]?/i, "")
    .replace(/^resume[-_ ]?/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 3) return "";
  if (/^cv\d*$/i.test(cleaned)) return "";

  return cleaned;
}

/* ================= CANDIDATE HELPERS ================= */
function getCandidateObj(c) {
  return c?.extracted?.extracted || c?.extracted || c?.parsed || {};
}

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
    safeStr(parsed?.personal_info?.full_name);

  if (full) return full;

  const prenom =
    safeStr(c?.prenom) ||
    safeStr(extracted?.manual?.prenom) ||
    safeStr(extracted?.prenom) ||
    safeStr(parsed?.manual?.prenom) ||
    safeStr(parsed?.prenom) ||
    safeStr(extracted?.first_name) ||
    safeStr(parsed?.first_name);

  const nom =
    safeStr(c?.nom) ||
    safeStr(extracted?.manual?.nom) ||
    safeStr(extracted?.nom) ||
    safeStr(parsed?.manual?.nom) ||
    safeStr(parsed?.nom) ||
    safeStr(extracted?.last_name) ||
    safeStr(parsed?.last_name);

  const constructed = `${prenom} ${nom}`.trim();
  if (constructed) return constructed;

  return guessNameFromFilename(c) || "Candidat";
}

function getInitials(name) {
  const n = safeStr(name);
  if (!n) return "??";
  const parts = n.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function formatTimeAgo(date) {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${days} j`;
}

/* ================= PAGE ================= */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    jobOffers: 0,
    candidatures: 0,
  });

  const [lastCandidatures, setLastCandidatures] = useState([]);
  const [loadingLast, setLoadingLast] = useState(true);

  // ✅ Chart states
  const [jobsStats, setJobsStats] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [jobsRes, candRes, lastRes, chartRes] = await Promise.all([
          getJobCount(),
          getCondidatureCount(),
          getCandidaturesWithJob(),
          getJobsWithCandidatureCount(),
        ]);

        setStats({
          jobOffers: jobsRes.data.count,
          candidatures: candRes.data.count,
        });

        // ===== Dernières candidatures =====
        const list = lastRes.data || [];

        const sorted = [...list].sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setLastCandidatures(sorted.slice(0, 3));

        // ===== Histogramme =====
        // ===== Histogramme (uniquement offres avec candidatures > 0) =====
        const chartData = (chartRes.data || [])
          .filter((j) => Number(j?.candidaturesCount || 0) > 0)
          .map((j) => {
            const title = safeStr(j?.titre) || "Offre";
            return {
              name: title.length > 14 ? title.slice(0, 14) + "..." : title,
              candidatures: Number(j?.candidaturesCount || 0),
            };
          });

        setJobsStats(chartData);
      } catch (err) {
        console.error("Erreur dashboard", err);
        setLastCandidatures([]);
        setJobsStats([]);
      } finally {
        setLoadingLast(false);
        setLoadingChart(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 px-6 py-14">
      <div className="max-w-7xl mx-auto">
        {/* ===== Header ===== */}
        <h1 className="text-4xl font-extrabold text-gray-900">
          Bienvenue dans votre espace RH 👋
        </h1>

        <p className="text-gray-600 mb-10">
          Voici un aperçu de vos activités de recrutement.
        </p>

        {/* ===== Stats Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14">
          {/* Offres */}
          <div className="bg-white rounded-3xl shadow-md p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-[#4E8F2F]" />
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium">
                Offres d’emploi
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.jobOffers}
              </p>
            </div>
          </div>

          {/* Candidatures */}
          <div className="bg-white rounded-3xl shadow-md p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium">Candidatures</p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.candidatures}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Chart ===== */}
        <div className="bg-white rounded-3xl shadow-md p-8 mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Candidatures par offre
            </h2>
            <p className="text-sm text-gray-500">
              Répartition des candidatures selon les offres
            </p>
          </div>

          {loadingChart ? (
            <p className="text-gray-500 text-sm">Chargement du graphique...</p>
          ) : jobsStats.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune donnée disponible.</p>
          ) : (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobsStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="candidatures" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ===== Title + Voir tout OUTSIDE table container ===== */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Dernières Candidatures
          </h2>

          <Link
            href="/admin/candidatures"
            className="text-sm font-semibold text-[#4E8F2F] hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {/* ===== TABLE CONTAINER ===== */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {loadingLast ? (
            <div className="p-8 text-gray-500 text-sm">Chargement...</div>
          ) : lastCandidatures.length === 0 ? (
            <div className="p-8 text-gray-500 text-sm">
              Aucune candidature disponible.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* HEADER */}
                <thead className="bg-white">
                  <tr className="text-gray-400 uppercase text-xs">
                    <th className="text-left px-10 py-6">Candidat</th>
                    <th className="text-left px-10 py-6">Poste</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-gray-100">
                  {lastCandidatures.map((c) => {
                    const fullName = getFullName(c);
                    const jobTitle = safeStr(c?.jobTitle) || "—";

                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-green-50/40 transition"
                      >
                        {/* CANDIDAT */}
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center text-[#4E8F2F] font-bold">
                              {getInitials(fullName)}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatTimeAgo(c?.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* POSTE */}
                        <td className="px-10 py-6 text-gray-600">{jobTitle}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
