"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getQuizByJob, generateQuiz, regenerateQuiz } from "../../../services/quiz.api"; // بدّل المسار إذا يلزم
import { Loader2, AlertCircle, Zap, RefreshCw } from "lucide-react";

export default function QuizTechniqueDetailsPage() {
  const params = useParams();

  // ✅ folder = [jobOfferId] => params.jobOfferId
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
    // ✅ حماية ضد undefined
    if (!jobOfferId || jobOfferId === "undefined" || jobOfferId === "null") {
      setLoading(false);
      setError("jobOfferId manquant dans l’URL");
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
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-gray-500">Chargement du quiz...</span>
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

  // ✅ إذا ما فماش quiz
  if (!quiz) {
    return (
      <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center space-y-4">
        <div className="text-lg font-bold">Aucun quiz pour cette offre</div>
        <button
          onClick={() => handleGenerate(false)}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#6CB33F] text-white disabled:opacity-60"
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

  // ✅ عرض بسيط (إنت تنجم تزيد UI متاع questions كيما تحب)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Quiz technique</h1>
          <p className="text-sm text-gray-500">
            Questions: {quiz.totalQuestions ?? quiz.questions?.length ?? 0} — Status:{" "}
            <span className="font-semibold">{quiz.status}</span>
          </p>
        </div>

        <button
          onClick={() => handleGenerate(true)}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-gray-700 disabled:opacity-60"
        >
          <RefreshCw className="w-4 h-4" />
          Regénérer
        </button>
      </div>

      <pre className="p-4 rounded-2xl bg-gray-900 text-white overflow-auto text-xs">
        {JSON.stringify(quiz, null, 2)}
      </pre>
    </div>
  );
}
