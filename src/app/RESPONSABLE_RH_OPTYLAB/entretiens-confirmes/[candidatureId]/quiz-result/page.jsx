"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../services/api";
import {
  Brain,
  CheckCircle,
  XCircle,
  Loader2,
  Clock3,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function safeStr(v) {
  return v ? String(v).trim() : "";
}
function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = safeStr(v);
    if (s) return s;
  }
  return "";
}

function getCandidateName(c) {
  return (
    firstNonEmpty(
      c?.fullName,
      `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim(),
      c?.extracted?.parsed?.full_name,
      `${safeStr(c?.extracted?.parsed?.first_name)} ${safeStr(c?.extracted?.parsed?.last_name)}`.trim(),
      c?.email,
    ) || "Candidat"
  );
}
function getCandidateEmail(c) {
  return (
    firstNonEmpty(
      c?.email,
      c?.personalInfoForm?.email,
      c?.extracted?.parsed?.email,
    ) || "—"
  );
}
function getCandidatePhone(c) {
  return (
    firstNonEmpty(
      c?.telephone,
      c?.phone,
      c?.personalInfoForm?.telephone,
      c?.extracted?.parsed?.phone,
    ) || "—"
  );
}
function getCandidateJobTitle(c) {
  return (
    firstNonEmpty(
      c?.jobTitle,
      c?.offreTitle,
      c?.poste,
      c?.job?.titre,
      c?.offre?.titre,
    ) || "—"
  );
}

// ─── Score circle ────────────────────────────────────────────────────────────
function ScoreCircle({ percentage }) {
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percentage / 100) * circ;
  const color =
    percentage >= 80
      ? "#4E8F2F"
      : percentage >= 65
        ? "#69B332"
        : percentage >= 50
          ? "#9CCB73"
          : "#C96A3D";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          className="dark:stroke-slate-700"
          strokeWidth="12"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-xs font-medium mt-1" style={{ color }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

function resolveAnswer(val, order, questions = []) {
  if (val === null || val === undefined) return "—";
  const str = String(val).trim().toUpperCase();
  if (/^[A-E]$/.test(str)) {
    const idx = str.charCodeAt(0) - 65;
    const q = questions.find((q) => q.order === order);
    if (!q?.options) return str;
    const opt = q.options[idx];
    if (!opt) return str;
    if (typeof opt === "string") return opt.trim();
    if (typeof opt === "object")
      return opt.text || opt.label || opt.value || str;
  }
  return String(val).trim();
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();
  const candidatureId = params?.candidatureId;

  const [quiz, setQuiz] = useState(null);
  const [quizQuestions, setQuizQ] = useState([]);
  const [candidature, setCandidature] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!candidatureId) return;
  (async () => {
    setLoading(true);
    try {
      // 1. Charger l'interview par son _id → récupérer le vrai candidatureId
      let realCandidatureId = candidatureId;
      try {
        const ivRes = await api.get(`/api/interviews/${candidatureId}`);
        const iv = ivRes.data?.data || ivRes.data;
        if (iv?.candidatureId) {
          realCandidatureId = String(iv.candidatureId);
        }
      } catch (_) {}

      // 2. Candidature avec le vrai ID
      try {
        const cRes = await api.get(`/candidatures/${realCandidatureId}`);
        setCandidature(cRes.data?.data || cRes.data);
      } catch (err) {
        console.warn("Candidature fetch error:", err?.response?.status);
      }

      // 3. Quiz avec le vrai candidatureId
      try {
        const qRes = await api.get(`/quiz-submissions/candidature/${realCandidatureId}`);
        const list = Array.isArray(qRes.data) ? qRes.data
          : Array.isArray(qRes.data?.submissions) ? qRes.data.submissions : [];
        const latest = list[0] || null;
        setQuiz(latest);
        if (latest?.quizId) {
          try {
            const qqRes = await api.get(`/quizzes/${latest.quizId}`);
            setQuizQ(qqRes.data?.questions || []);
          } catch {}
        }
      } catch (err) {
        if (err?.response?.status === 403) setQuiz("FORBIDDEN");
        else console.error("Quiz fetch error:", err);
      }

    } finally { setLoading(false); }
  })();
}, [candidatureId]);

  const name = useMemo(() => getCandidateName(candidature), [candidature]);
  const email = useMemo(() => getCandidateEmail(candidature), [candidature]);
  const phone = useMemo(() => getCandidatePhone(candidature), [candidature]);
  const jobTitle = useMemo(
    () => getCandidateJobTitle(candidature),
    [candidature],
  );
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toLowerCase() || "c";
  const statusLabel =
    safeStr(candidature?.statusLabel) ||
    safeStr(candidature?.status) ||
    "En attente";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Retour ── */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E8F2F] dark:text-green-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* ── Header candidat ── */}
        <div className="mb-6 rounded-[1.75rem] border border-[#dfead6] dark:border-slate-700 bg-[#eef6e8] dark:bg-slate-900 shadow-sm px-5 sm:px-7 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#74bf37] dark:bg-green-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1430] dark:text-white leading-tight">
                  {name}
                </h1>
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#69b332]" />
                      {email}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#69b332]" />
                      {phone}
                    </span>
                  </div>
                  <p className="text-base sm:text-xl text-[#69b332] dark:text-green-400 font-semibold">
                    {jobTitle}
                  </p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4df9f] dark:bg-amber-900/40 text-[#c55b00] dark:text-amber-300 px-4 py-2 text-sm font-semibold whitespace-nowrap self-start lg:self-center">
              <Clock3 className="w-4 h-4" />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Empty / Forbidden state ── */}
        {quiz === "FORBIDDEN" ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#dfead6] dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 mx-auto flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Accès restreint
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Les résultats du quiz ne sont pas accessibles avec votre rôle
              actuel.
              <br />
              <span className="text-xs text-gray-400 mt-1 block font-mono">
                → Ajouter "DGA" dans requireRoles de
                /quiz-submissions/candidature/:id
              </span>
            </p>
          </div>
        ) : !quiz ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#dfead6] dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EEF7E9] dark:bg-slate-700 mx-auto flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-[#4E8F2F] dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Aucun quiz soumis
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Ce candidat n'a pas encore soumis de réponses de quiz.
            </p>
          </div>
        ) : (
          /* ── Quiz results ── */
          <div className="bg-white dark:bg-slate-800 border border-[#dfead6] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#dfead6] dark:border-slate-700 bg-[#F4FAF0] dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2.5 text-gray-900 dark:text-white">
                  <Brain className="w-5 h-5 text-[#4E8F2F] dark:text-green-400" />
                  Résultats du Quiz Technique
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Terminé le {formatDate(quiz.submittedAt)}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Score + stats */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8">
                <div className="shrink-0">
                  <ScoreCircle percentage={quiz.percentage} />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="text-center p-4 bg-[#EEF7E9] dark:bg-green-900/20 rounded-xl border border-[#d6e8ca] dark:border-green-800/40">
                    <p className="text-3xl font-bold text-[#4E8F2F] dark:text-green-300">
                      {quiz.score}
                    </p>
                    <p className="text-sm text-[#4E8F2F] dark:text-green-400 mt-1">
                      CORRECTES
                    </p>
                  </div>
                  <div className="text-center p-4 bg-[#FFF7ED] dark:bg-orange-900/20 rounded-xl border border-[#F5D6B3] dark:border-orange-800/40">
                    <p className="text-3xl font-bold text-[#C55B00] dark:text-orange-300">
                      {quiz.totalQuestions - quiz.score}
                    </p>
                    <p className="text-sm text-[#C55B00] dark:text-orange-400 mt-1">
                      INCORRECTES
                    </p>
                  </div>
                  <div className="text-center p-4 bg-[#F7F8F6] dark:bg-slate-800 rounded-xl border border-[#dfe5d7] dark:border-slate-700">
                    <p className="text-3xl font-bold text-[#0b1430] dark:text-gray-200">
                      {quiz.totalQuestions}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      TOTAL
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-5">
                {quiz.answers?.map((a, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-xl border ${
                      a.isCorrect
                        ? "bg-[#F4FAF0] dark:bg-green-900/20 border-[#cfe4c4] dark:border-green-800/40"
                        : "bg-[#FFF7ED] dark:bg-orange-900/20 border-[#F5D6B3] dark:border-orange-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 ${a.isCorrect ? "bg-[#6CB33F]" : "bg-[#D97706]"}`}
                      >
                        {a.order || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                          {a.question}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                              a.isCorrect
                                ? "bg-[#DFF0D4] dark:bg-green-800/30 text-[#2F6B1B] dark:text-green-200"
                                : "bg-[#FDE6D0] dark:bg-orange-800/30 text-[#B45309] dark:text-orange-200"
                            }`}
                          >
                            {a.isCorrect ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {resolveAnswer(
                              a.selectedAnswer,
                              a.order,
                              quizQuestions,
                            )}
                          </div>
                          {!a.isCorrect && a.correctAnswer && (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-[#DFF0D4] dark:bg-green-800/30 text-[#2F6B1B] dark:text-green-200">
                              <CheckCircle className="w-4 h-4" />
                              {resolveAnswer(
                                a.correctAnswer,
                                a.order,
                                quizQuestions,
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!quiz.answers?.length && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                    Aucune réponse disponible.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
