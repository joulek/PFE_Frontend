"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getQuizByJob, generateQuiz, regenerateQuiz } from "../../../services/quiz.api";
import { Loader2, AlertCircle, Zap, RefreshCw, CheckCircle2 } from "lucide-react";

export default function QuizTechniqueDetailsPage() {
  const params = useParams();

  const jobOfferId = useMemo(() => String(params?.jobOfferId || ""), [params]);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQuizByJob(jobOfferId);
      setQuiz(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setQuiz(null);
      else setError("Erreur lors du chargement du quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobOfferId || jobOfferId === "undefined" || jobOfferId === "null") {
      setLoading(false);
      setError("jobOfferId manquant dans l'URL");
      return;
    }
    load();
  }, [jobOfferId]);

  const handleGenerate = async (regen = false) => {
    setGenerating(true);
    setError(null);
    try {
      if (regen) await regenerateQuiz(jobOfferId);
      else await generateQuiz(jobOfferId);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement du quiz...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center space-y-4">
        <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Aucun quiz pour cette offre
        </div>
        <button
          onClick={() => handleGenerate(false)}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#6CB33F] text-white disabled:opacity-60 hover:bg-[#5fa035] transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Générer automatiquement
            </>
          )}
        </button>
      </div>
    );
  }

  // Récupérer les questions (gère différents formats possibles)
  const questions = quiz.questions || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {quiz.jobTitle || "Quiz technique"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {questions.length} question{questions.length > 1 ? "s" : ""} — Status:{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              {quiz.status || "ACTIVE"}
            </span>
          </p>
        </div>

        <button
          onClick={() => handleGenerate(true)}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Régénération...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Regénérer
            </>
          )}
        </button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500 dark:text-gray-400">
          Aucune question disponible
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q._id || idx}
              className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6CB33F] text-white flex items-center justify-center font-bold text-sm">
                  {q.order || idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {q.category || "Général"}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {q.difficulty || "medium"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {q.question}
                  </h3>
                </div>
              </div>
              {/* Options */}
              <div className="space-y-2 ml-11">
                {(q.options || []).map((option, optIdx) => {
                  const isCorrect = option.key === q.correctAnswer;
                  return (
                    <div
                      key={optIdx}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect
                              ? "bg-[#6CB33F] text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {option.key}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-100">
                            {option.text}
                          </p>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-[#6CB33F] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Explanation (if available) */}
              {q.explanation && (
                <div className="mt-4 ml-11 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-900 dark:text-white mb-1">
                    💡 Explication
                  </p>
                  <p className="text-sm text-blue-800 dark:text-white">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


    </div>
  );
}