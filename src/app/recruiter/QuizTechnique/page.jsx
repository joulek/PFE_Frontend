"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllQuizzes, deleteQuiz } from "../../services/quiz.api"; // بدّل المسار إذا يلزم
import { Loader2, Search, Trash2, ExternalLink, AlertCircle } from "lucide-react";

export default function QuizTechniqueListPage() {
  const [items, setItems] = useState([]);      // quizzes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

 const fetchAll = async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await getAllQuizzes();

    // 🔍 DEBUG
    console.log("FULL RESPONSE 👉", res);
    console.log("DATA 👉", res.data);

    setItems(res.data || []);

  } catch (err) {
    console.log("ERROR 👉", err);
    setError(err.response?.data?.message || "Erreur chargement des quiz");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = (x.jobTitle || x.titre || "").toLowerCase();
      const jobId = (x.jobId || "").toLowerCase();
      return title.includes(s) || jobId.includes(s);
    });
  }, [items, q]);

  const handleDelete = async (quizId) => {
    if (!confirm("Supprimer ce quiz ?")) return;
    try {
      await deleteQuiz(quizId);
      setItems((prev) => prev.filter((x) => x._id !== quizId));
    } catch (err) {
      alert(err.response?.data?.message || "Erreur suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-gray-500">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quiz techniques</h1>
          <p className="text-sm text-gray-500">
            {items.length} quiz
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
          <Search className="w-4 h-4 opacity-70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre ou jobId..."
            className="outline-none bg-transparent w-72 max-w-full"
          />
        </div>
      </div>

     
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500">
            Aucun quiz trouvé
          </div>
        ) : (
          filtered.map((x) => (
            <div
              key={x._id}
              className="p-4 rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-bold text-gray-800 dark:text-gray-100 break-words">
                  {x.jobTitle || x.titre || "Sans titre"}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>
                    <span className="font-semibold">jobId:</span>{" "}
                    <span className="font-mono">{x.jobOfferId}</span>
                  </span>
                  <span>
                    <span className="font-semibold">Questions:</span>{" "}
                    {x.totalQuestions ?? x.questionsCount ?? x.questions?.length ?? "-"}
                  </span>
                  <span>
                    <span className="font-semibold">Status:</span>{" "}
                    {x.status || "—"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {/* ✅ يمشي لصفحة التفاصيل */}
                <Link
                  href={`/recruiter/QuizTechnique/${x.jobOfferId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir
                </Link>

                <button
                  onClick={() => handleDelete(x._id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
