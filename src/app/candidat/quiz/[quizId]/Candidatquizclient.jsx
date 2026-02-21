"use client";

// ✅ À placer dans : app/candidat/quiz/[quizId]/CandidatQuizClient.jsx

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getQuizById, submitQuiz,checkQuizAlreadySubmitted } from "../../../services/quiz.api.js";

import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Flag,
  Clock,
} from "lucide-react";

/* ================================================================
   HELPERS
================================================================ */
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** ✅ Normalise texte: accepte string OU {key,text} OU {value,label} */
function normalizeText(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "object")
    return v.text ?? v.label ?? v.value ?? v.key ?? fallback;
  return String(v);
}

/** ✅ Normalise options: string[] OU [{key,text}] OU [{value,label}] */
function normalizeOptions(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((o) => {
    if (typeof o === "string") return { value: o, label: o };
    if (o && typeof o === "object") {
      const value = o.key ?? o.value ?? o.text ?? o.label;
      const label = o.text ?? o.label ?? String(value ?? "");
      return { value, label };
    }
    return { value: String(o), label: String(o) };
  });
}

/* ================================================================
   QUESTION CARD
================================================================ */
function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  questionNumber,
  total,
}) {
  const letters = ["A", "B", "C", "D", "E", "F"];

  // ✅ FIX question text (backend peut envoyer question.question OU question.text sous forme objet)
  const questionText = normalizeText(question?.question ?? question?.text, "Question");

  // ✅ FIX options (backend peut envoyer [{key,text}] -> impossible à render direct)
  const options = normalizeOptions(question?.options);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wide">
            Question {questionNumber} sur {total}
          </span>

          {question?.difficulty && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                question.difficulty === "easy"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : question.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {question.difficulty === "easy"
                ? "Facile"
                : question.difficulty === "medium"
                ? "Moyen"
                : "Difficile"}
            </span>
          )}

          {question?.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold">
              {normalizeText(question.category)}
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
          {questionText}
        </h2>
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => {
          const isSelected = selectedAnswer === opt.value;

          return (
            <button
              key={opt.value ?? i}
              onClick={() => onSelect(opt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                isSelected
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-all ${
                  isSelected
                    ? "bg-violet-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600"
                }`}
              >
                {letters[i] || i + 1}
              </span>

              <span
                className={`text-sm sm:text-base font-medium flex-1 leading-snug ${
                  isSelected
                    ? "text-violet-800 dark:text-violet-200"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {opt.label}
              </span>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   MAIN
================================================================ */
export default function CandidatQuizClient() {
  const router = useRouter();

  // ✅ useParams() récupère { quizId } depuis [quizId]
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params?.quizId;
  const candidatureId = searchParams?.get("candidatureId");

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [showOverview, setShowOverview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Timer par question (30 secondes par défaut) ──
  const TIME_PER_QUESTION = 30;
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const timerRef = useRef(null);

  /* ── Charger le quiz ── */
  useEffect(() => {
  if (!quizId) {
    setError("Quiz ID manquant");
    setLoading(false);
    return;
  }

  if (!candidatureId) {
    setError("Lien invalide (candidature manquante)");
    setLoading(false);
    return;
  }

  async function load() {
    try {
      /* ===============================
         1️⃣ CHECK DÉJÀ SOUMIS
      =============================== */
      const checkRes = await checkQuizAlreadySubmitted(quizId, candidatureId);
      if (checkRes?.data?.alreadySubmitted) {
        // 👉 نفس logique متاع fiche
        router.replace(`/candidat/quiz/${quizId}/deja-soumis`);
        return;
      }

      /* ===============================
         2️⃣ LOAD QUIZ
      =============================== */
      const res = await getQuizById(quizId);
      const data = res?.data;

      if (!data) {
        setError("Quiz introuvable");
        return;
      }

      const sorted = [...(data.questions || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      setQuiz({ ...data, questions: sorted });
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le quiz. Vérifiez le lien.");
    } finally {
      setLoading(false);
    }
  }

  load();
}, [quizId, candidatureId, router]);

  const totalQuestions = quiz?.questions?.length || 0;
  const currentQuestion = quiz?.questions?.[currentIndex];
  const currentOrder = currentQuestion?.order;

  // ── Timer : reset + countdown à chaque changement de question ──
  useEffect(() => {
    setTimeLeft(TIME_PER_QUESTION);
    clearInterval(timerRef.current);

    // stop timer if not ready / modal / submitting
    if (!quiz || confirming || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (currentIndex >= totalQuestions - 1) {
            setConfirming(true);
          } else {
            setCurrentIndex((x) => Math.min(x + 1, totalQuestions - 1));
          }
          return TIME_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, quiz, totalQuestions, confirming, submitting]);

  const selectedAnswer = useMemo(() => {
    if (currentOrder === null || currentOrder === undefined) return null;
    return answers[currentOrder] ?? null;
  }, [answers, currentOrder]);

  function handleSelect(value) {
    if (currentOrder === null || currentOrder === undefined) return;
    setAnswers((prev) => ({ ...prev, [currentOrder]: value }));
  }

  function handleFlag() {
    if (currentOrder === null || currentOrder === undefined) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentOrder)) next.delete(currentOrder);
      else next.add(currentOrder);
      return next;
    });
  }

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));
  }, [totalQuestions]);

  async function handleSubmit() {
    setSubmitting(true);
    setConfirming(false);
    setError("");

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([order, selectedAnswer]) => ({
          order: Number(order),
          selectedAnswer, // ✅ toujours string/primitive (pas objet)
        })
      );

      await submitQuiz({
        quizId,
        candidatureId: candidatureId || undefined,
        answers: formattedAnswers,
      });

      // ✅ IMPORTANT: on ne montre PAS le score au candidat
      router.replace(`/candidat/quiz/${quizId}/merci`);
      return;
    } catch (e) {
      setError(
        e?.response?.data?.message || "Erreur lors de la soumission. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Modal confirmation ── */
  if (confirming)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-violet-500" />
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Soumettre le quiz ?
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Voulez-vous confirmer la soumission de vos réponses ?
          </p>

          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={() => setConfirming(false)}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-60"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Envoi..." : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    );

  /* ── Loading / Error ── */
  if (loading)
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="font-semibold">Chargement du quiz...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow p-8">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
            Oups !
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );

  /* ── Overview ── */
  if (showOverview && quiz) {
    const questions = quiz.questions || [];
    return (
      <div className="min-h-[70vh] p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setShowOverview(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>

            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
              Vue d&apos;ensemble
            </h2>
          </div>

          <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const order = q.order;
                const answered = answers[order] !== undefined;
                const isFlagged = flagged.has(order);

                return (
                  <button
                    key={order ?? idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowOverview(false);
                    }}
                    className={`relative px-3 py-3 rounded-2xl border-2 text-sm font-bold transition ${
                      answered
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-200"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-violet-300 dark:hover:border-violet-600"
                    }`}
                  >
                    Q{idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow">
                        <Flag className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-6 gap-3 flex-wrap">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Répondu :{" "}
                <span className="font-bold">
                  {Object.keys(answers).length}/{questions.length}
                </span>
              </div>

              <button
                onClick={() => setConfirming(true)}
                className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition"
              >
                Soumettre
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main quiz UI ── */
  const title = normalizeText(quiz?.jobTitle ?? quiz?.title ?? quiz?.titre, "Quiz");
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-[70vh] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow p-5 mb-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wide">
                Quiz technique
              </p>
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm">
                {answeredCount}/{totalQuestions}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200 font-bold text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>

              <button
                onClick={() => setShowOverview(true)}
                className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Vue d&apos;ensemble
              </button>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar current={currentIndex + 1} total={totalQuestions} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow p-6 sm:p-8">
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onSelect={handleSelect}
            questionNumber={currentIndex + 1}
            total={totalQuestions}
          />

          {/* Bottom actions */}
          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={handleFlag}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold transition ${
                flagged.has(currentOrder)
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Flag className="w-4 h-4" />
              Marquer
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold transition"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold transition"
                >
                  Terminer
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {!selectedAnswer && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Sélectionnez une réponse pour continuer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}