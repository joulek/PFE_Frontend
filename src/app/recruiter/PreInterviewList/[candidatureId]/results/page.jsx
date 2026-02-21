"use client";

// 📁 app/recruiter/PreInterviewList/[candidatureId]/results/page.jsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../services/api";
import { getQuizByJob } from "../../../../services/quiz.api";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  ClipboardList,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  AlertCircle,
  Loader2,
  User,
  Briefcase,
  Calendar,
  BarChart2,
  TrendingUp,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeStr(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}

// Convertit n'importe quelle valeur de fiche en texte lisible
// Formate une clé snake_case/camelCase en label lisible
function formatKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase());
}

// Détecte si une clé est un ObjectId MongoDB (24 hex chars)
function isObjectId(key) {
  return /^[a-f0-9]{24}$/i.test(String(key));
}

// Formate une valeur primitive en string lisible
function formatVal(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  return String(v).trim() || null;
}

// Convertit n'importe quelle valeur de fiche en JSX lisible
function renderFicheValue(value) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-gray-400 italic text-sm font-normal">
        Non renseigné
      </span>
    );
  }

  // ── Tableau ──────────────────────────────────────────────
  if (Array.isArray(value)) {
    if (value.length === 0)
      return (
        <span className="text-gray-400 italic text-sm font-normal">—</span>
      );

    // Tableau de primitives simples
    if (!value.some((item) => item && typeof item === "object")) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((item, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    // Tableau d'objets → mini table (ex: langues, logiciels)
    return (
      <div className="mt-2 space-y-2">
        {value.map((item, i) => {
          if (!item || typeof item !== "object") {
            return (
              <span
                key={i}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 inline-block mr-2"
              >
                {String(item)}
              </span>
            );
          }
          // Filtrer les clés ObjectId MongoDB — garder seulement les vraies clés lisibles
          const entries = Object.entries(item).filter(
            ([k, v]) => !isObjectId(k) && formatVal(v) !== null,
          );
          // Si toutes les clés sont des ObjectIds, ignorer cet item
          if (entries.length === 0) return null;
          return (
            <div
              key={i}
              className="flex flex-wrap gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
            >
              {entries.map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-sm">
                  <span className="text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wide">
                    {formatKey(k)} :
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatVal(v)}
                  </span>
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Objet simple ─────────────────────────────────────────
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(
      ([k, v]) => !isObjectId(k) && formatVal(v) !== null,
    );
    if (entries.length === 0)
      return (
        <span className="text-gray-400 italic text-sm font-normal">—</span>
      );
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {entries.map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wide">
              {formatKey(k)} :
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatVal(v)}
            </span>
          </span>
        ))}
      </div>
    );
  }

  // ── Primitif ─────────────────────────────────────────────
  const str = String(value).trim();
  if (!str)
    return (
      <span className="text-gray-400 italic text-sm font-normal">
        Non renseigné
      </span>
    );
  return str;
}

/* ── Cercle score animé ── */
function ScoreRing({ percentage, size = 120 }) {
  const r = size / 2 - 10;
  const dash = 2 * Math.PI * r;
  const offset = dash - (percentage / 100) * dash;
  const color =
    percentage >= 75 ? "#22c55e" : percentage >= 50 ? "#eab308" : "#ef4444";
  const bg =
    percentage >= 75
      ? "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
      : percentage >= 50
        ? "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
        : "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-3xl p-6 bg-gradient-to-br ${bg}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          className="dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/* ── Badge label ── */
function ScoreLabel({ percentage }) {
  if (percentage >= 80)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
        <Trophy className="w-4 h-4" /> Excellent
      </span>
    );
  if (percentage >= 60)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm">
        <Target className="w-4 h-4" /> Bon résultat
      </span>
    );
  if (percentage >= 40)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
        <AlertCircle className="w-4 h-4" /> Passable
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm">
      <XCircle className="w-4 h-4" /> À améliorer
    </span>
  );
}

/* ================================================================
   SECTION QUIZ
================================================================ */
function QuizSection({ quiz, questions = [] }) {
  const [expanded, setExpanded] = useState(true);

  // Extraire le texte lisible d'une option (gère tous formats ML)
  function normalizeOption(raw) {
    if (!raw) return null;
    if (typeof raw === "string") return raw.trim() || null;
    // {key:"A", text:"..."} ou {label:"...", value:"..."}
    const text =
      raw.text ?? raw.label ?? raw.value ?? raw.content ?? raw.option ?? null;
    if (text !== null && text !== undefined) return String(text).trim() || null;
    // {A: "texte"} — clé lettre directe
    const letterKeys = ["A", "B", "C", "D", "E"];
    for (const k of letterKeys) {
      if (raw[k] !== undefined) return String(raw[k]).trim() || null;
    }
    // Dernier recours: première valeur string de l'objet
    const vals = Object.values(raw).filter(
      (v) => typeof v === "string" && v.trim(),
    );
    return vals[0] || null;
  }

  // Mapper lettre (A/B/C/D) vers le texte complet de l'option
  function resolveAnswer(answerVal, order) {
    if (!answerVal && answerVal !== 0) return "Sans réponse";
    const val = String(answerVal).trim();
    if (!val) return "Sans réponse";

    // Cas 1 — lettre seule (A, B, C, D, E)
    if (/^[A-Ea-e]$/.test(val)) {
      const idx = val.toUpperCase().charCodeAt(0) - 65; // A=0, B=1...
      const question = questions.find((q) => q.order === order);
      const opts = question?.options || [];

      // Chercher par index direct
      const byIndex = normalizeOption(opts[idx]);
      if (byIndex) return byIndex;

      // Chercher par clé lettre dans les options
      for (const opt of opts) {
        if (opt && typeof opt === "object") {
          if (opt.key === val.toUpperCase() || opt.key === val.toLowerCase()) {
            return normalizeOption(opt) || val;
          }
          if (opt.label === val.toUpperCase()) {
            return normalizeOption(opt) || val;
          }
        }
      }
    }

    // Cas 2 — déjà du texte complet (plus d'une lettre)
    return val;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg">
                Quiz Technique
              </h2>
              <p className="text-violet-200 text-sm">
                Soumis le {formatDate(quiz.submittedAt)}
              </p>
            </div>
          </div>
          <ScoreLabel percentage={quiz.percentage} />
        </div>
      </div>

      {/* Score stats */}
      <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-8 border-b border-gray-100 dark:border-gray-700">
        <ScoreRing percentage={quiz.percentage} size={130} />

        <div className="flex-1 space-y-4 w-full">
          {/* Barre */}
          <div>
            <div className="flex justify-between text-sm font-semibold mb-1.5">
              <span className="text-green-600 dark:text-green-400">
                ✓ {quiz.score} correctes
              </span>
              <span className="text-red-500 dark:text-red-400">
                ✗ {quiz.totalQuestions - quiz.score} incorrectes
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-400 rounded-l-full transition-all duration-1000"
                style={{ width: `${quiz.percentage}%` }}
              />
              <div className="h-full flex-1 bg-red-200 dark:bg-red-900/30 rounded-r-full" />
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">
                {quiz.score}
              </p>
              <p className="text-xs text-green-700 dark:text-green-500 font-medium mt-0.5">
                Correctes
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-red-500 dark:text-red-400">
                {quiz.totalQuestions - quiz.score}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-0.5">
                Incorrectes
              </p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
                {quiz.totalQuestions}
              </p>
              <p className="text-xs text-violet-700 dark:text-violet-500 font-medium mt-0.5">
                Total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle réponses */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Détail des {quiz.answers?.length || 0} réponses
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full transition-all ${expanded ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"}`}
        >
          {expanded ? "Masquer" : "Afficher"}
        </span>
      </button>

      {/* Réponses */}
      {expanded && Array.isArray(quiz.answers) && quiz.answers.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {quiz.answers.map((a, i) => (
            <div
              key={i}
              className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                a.isCorrect
                  ? "hover:bg-green-50/50 dark:hover:bg-green-900/10"
                  : "hover:bg-red-50/50 dark:hover:bg-red-900/10"
              }`}
            >
              {/* Numéro */}
              <div
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                  a.isCorrect
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                    : "bg-red-100 dark:bg-red-900/30 text-red-500"
                }`}
              >
                {a.order ?? i + 1}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug mb-1.5">
                  {a.question}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      a.isCorrect
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {a.isCorrect ? "✓" : "✗"}{" "}
                    {resolveAnswer(a.selectedAnswer, a.order)}
                  </span>
                  {!a.isCorrect && a.correctAnswer && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      ✓ {resolveAnswer(a.correctAnswer, a.order)}
                    </span>
                  )}
                </div>
              </div>

              {/* Icône */}
              <div className="shrink-0 mt-0.5">
                {a.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SECTION FICHE
================================================================ */
function PdfDownloadButton({ submissionId }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ api instance envoie automatiquement le JWT token
      const response = await api.get(
        `/fiche-submissions/${submissionId}/pdf`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche_${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <span>📄</span>
      )}
      {loading ? "Génération..." : "Télécharger PDF"}
    </button>
  );
}

function FicheSection({ fiche }) {
  if (!fiche) return null;
  const isSubmitted = fiche.status === "SUBMITTED";
  const pdfUrl = fiche._id ? `/api` : null; // handled by PdfDownloadButton

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {fiche.ficheTitle || "Fiche de renseignement"}
            </h2>
            <p className="text-green-100 text-sm mt-0.5">
              {isSubmitted
                ? `Complétée le ${formatDate(fiche.finishedAt || fiche.updatedAt)}`
                : "En cours de remplissage"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">
            {isSubmitted ? "✓ Complétée" : "⏳ En cours"}
          </span>
          {isSubmitted && fiche._id && (
            <PdfDownloadButton submissionId={fiche._id} />
          )}
        </div>
      </div>
    </div>
  );
}


export default function CandidateResultsPage() {
  const params = useParams();
  const router = useRouter();
  const candidatureId = params?.candidatureId;

  const [quizResult, setQuizResult] = useState(null);
  const [ficheResult, setFicheResult] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]); // pour mapper lettre → texte
  const [candidature, setCandidature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!candidatureId) return;
    async function load() {
      setLoading(true);
      try {
        // Charger infos candidature
        try {
          const c = await api.get(`/candidatures/${candidatureId}`);
          setCandidature(c?.data || null);
        } catch {
          setCandidature(null);
        }

        // Quiz submissions
        let quizSub = null;
        try {
          const r = await api.get(
            `/quiz-submissions/candidature/${candidatureId}`,
          );
          const list = Array.isArray(r?.data) ? r.data : [];
          quizSub = list[0] || null;
          setQuizResult(quizSub);
        } catch {
          setQuizResult(null);
        }

        // Charger les questions du quiz pour mapper lettre → texte complet
        if (quizSub?.quizId) {
          try {
            const qr = await api.get(`/quizzes/${quizSub.quizId}`);
            setQuizQuestions(qr?.data?.questions || []);
          } catch {
            setQuizQuestions([]);
          }
        }

        // Fiche submissions
        try {
          const ficheRes = await api.get(
            `/fiche-submissions/candidature/${candidatureId}`,
          );
          const ficheList = Array.isArray(ficheRes?.data) ? ficheRes.data : [];
          // Prendre la soumission la plus récente (dernier élément après sort desc)
          setFicheResult(ficheList.length > 0 ? ficheList[0] : null);
        } catch {
          setFicheResult(null);
        }
      } catch (e) {
        setError("Erreur lors du chargement des résultats.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [candidatureId]);

  /* ── Nom du candidat ── */
  const name = (() => {
    if (!candidature) return "Candidat";
    const full = safeStr(
      candidature?.fullName || candidature?.extracted?.parsed?.full_name,
    );
    if (full) return full;
    const combo =
      `${safeStr(candidature?.prenom)} ${safeStr(candidature?.nom)}`.trim();
    return combo || safeStr(candidature?.email) || "Candidat";
  })();

  const jobTitle = safeStr(candidature?.jobTitle) || "—";

  /* ── Loading ── */
  if (loading)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Chargement des résultats...
          </p>
        </div>
      </div>
    );

  /* ── Erreur ── */
  if (error)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold"
          >
            Retour
          </button>
        </div>
      </div>
    );

  const hasNothing = !quizResult && !ficheResult;

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── HEADER ── */}
        <div>
          <Link
            href="/recruiter/PreInterviewList"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                {name?.[0]?.toUpperCase() || "C"}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2">
                  {jobTitle !== "—" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      {jobTitle}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <BarChart2 className="w-4 h-4" />
                    {[
                      quizResult && "Quiz complété",
                      ficheResult && "Fiche complétée",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Aucune soumission"}
                  </span>
                </div>
              </div>

              {/* Score global si quiz */}
              {quizResult && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Score Quiz
                  </p>
                  <div
                    className={`text-2xl font-black px-4 py-1.5 rounded-2xl ${
                      quizResult.percentage >= 75
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : quizResult.percentage >= 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {quizResult.percentage}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── AUCUN RÉSULTAT ── */}
        {hasNothing && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
              Aucune soumission
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Ce candidat n'a pas encore soumis son quiz ou sa fiche de
              renseignement.
            </p>
          </div>
        )}

        {/* ── QUIZ RESULTS ── */}
        {quizResult && (
          <QuizSection quiz={quizResult} questions={quizQuestions} />
        )}

        {/* ── FICHE RESULTS ── */}
        {ficheResult && <FicheSection fiche={ficheResult} />}
      </div>
    </div>
  );
}