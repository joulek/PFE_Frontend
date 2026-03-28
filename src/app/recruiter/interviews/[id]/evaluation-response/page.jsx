"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User, Star } from "lucide-react";

export default function EvaluationResponsePage() {
  const { id } = useParams();

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${id}/evaluation`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEvaluation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
        Chargement...
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
        Aucune évaluation trouvée
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Critères d’évaluation
          </h1>

          <div className="mt-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
            <div className="bg-green-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">
              {evaluation?.evaluatedByName?.[0] || "R"}
            </div>

            <div>
              <p className="text-sm text-gray-500">Responsable métier</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {evaluation?.evaluatedByName || "Responsable métier"}
              </p>
            </div>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">

          {evaluation.ratings.map((r, index) => (
            <div key={index} className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-800 last:border-none">

              {/* QUESTION */}
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {index + 1}. {r.label}
              </p>

              {/* SCORE TYPE */}
              {typeof r.value === "number" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm border
                      ${
                        r.value === n
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                      }`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              )}

              {/* CHOIX */}
              {r.choices && (
                <div className="space-y-2">
                  {r.choices.map((choice, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-3 rounded-lg border
                      ${
                        choice === r.value
                          ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border
                        ${
                          choice === r.value
                            ? "bg-green-600 border-green-600"
                            : "border-gray-400"
                        }`}
                      />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {choice}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* OUI/NON */}
              {(r.value === "Oui" || r.value === "Non") && (
                <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-700">
                    {r.value}
                  </p>
                </div>
              )}

              {/* COMMENTAIRE */}
              {r.comment && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 mb-1">
                    Commentaire
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {r.comment}
                  </p>
                </div>
              )}

            </div>
          ))}

        </div>

        {/* EVALUATION GENERALE */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">

          <h2 className="font-semibold text-gray-800 dark:text-white">
            Évaluation générale
          </h2>

          {/* NOTE */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Note globale
            </p>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-6 h-6 ${
                    n <= evaluation.overallRating
                      ? "text-green-500 fill-green-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* COMMENTAIRE */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Observations supplémentaires
            </p>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
              {evaluation.notes || "—"}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}