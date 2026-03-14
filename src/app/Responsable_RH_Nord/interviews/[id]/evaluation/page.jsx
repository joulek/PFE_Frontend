"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Star,
  MessageSquare,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  console.log("🌐 API:", options.method || "GET", path);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("❌ HTTP:", res.status, errData);
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("❌ apiFetch ERROR:", err);
    throw err;
  }
}

export default function InterviewEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [interview, setInterview] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [criteria, setCriteria] = useState([]);
  
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const [evaluationNotes, setEvaluationNotes] = useState("");

  useEffect(() => {
    if (!interviewId) {
      setError("ID d'entretien manquant");
      setLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📌 Loading evaluation form for:", interviewId);
        // ✅ URL CORRECTE
        const formData = await apiFetch(`/api/interviews/${interviewId}/evaluation-form`);
        
        console.log("✅ Form loaded successfully");
        setInterview(formData.interview);
        setFiche(formData.fiche);
        setCriteria(formData.criteria || []);

        if (formData.existingEvaluation) {
          const existingEval = formData.existingEvaluation;
          setOverallRating(existingEval.overallRating || 0);
          setEvaluationNotes(existingEval.notes || "");

          const newRatings = {};
          const newComments = {};
          existingEval.ratings.forEach((r) => {
            newRatings[r.criterionId] = r.value;
            newComments[r.criterionId] = r.comment || "";
          });
          setRatings(newRatings);
          setComments(newComments);
        }
      } catch (err) {
        console.error("❌ Load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [interviewId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const evaluationData = {
        ficheId: fiche._id,
        ratings: criteria.map((crit) => ({
          criterionId: crit._id,
          label: crit.label,
          value: ratings[crit._id] || 0,
          comment: comments[crit._id] || "",
          type: crit.type,
        })),
        notes: evaluationNotes,
        overallRating,
      };
      
      console.log("💾 Saving evaluation...");
      // ✅ URL CORRECTE
      await apiFetch(`/api/interviews/${interviewId}/evaluation`, {
        method: "POST",
        body: JSON.stringify(evaluationData),
      });

      console.log("✅ Evaluation saved");
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      console.error("❌ Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-gray-950 dark:to-gray-900 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader size={40} className="animate-spin text-[#6CB33F]" />
            <span className="ml-4 text-sm sm:text-lg text-gray-600 dark:text-gray-400">
              Chargement...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-gray-950 dark:to-gray-900 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 sm:mb-8 flex items-center gap-2 text-[#6CB33F] hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 sm:p-6">
            <div className="flex gap-4">
              <AlertCircle size={24} className="flex-shrink-0 text-red-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-red-700 dark:text-red-400">
                  Erreur
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-gray-950 dark:to-gray-900 px-4 sm:px-6 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-[#6CB33F] transition hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800/80 p-4 sm:p-6 md:p-8 shadow-sm dark:border dark:border-gray-700">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Candidat
                </p>
                <h1 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {interview?.candidateName}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {interview?.candidateEmail}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Type d'entretien
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300">
                    Entretien RH Nord
                  </span>
                </div>
                <p className="mt-2 sm:mt-3 text-xs text-gray-500 dark:text-gray-400">
                  📋 {fiche?.name}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                    Date proposée
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {interview?.proposedDate
                      ? new Date(interview.proposedDate).toLocaleDateString("fr-FR")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                    Heure
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {interview?.proposedTime || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800/80 p-4 sm:p-6 md:p-8 shadow-sm dark:border dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {fiche?.description || "Critères d'évaluation"}
            </h2>

            <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
              {criteria && criteria.length > 0 ? (
                criteria.map((criterion, idx) => (
                  <div
                    key={criterion._id}
                    className="border-b border-gray-100 dark:border-gray-700 pb-6 sm:pb-8 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          {idx + 1}. {criterion.label}
                        </h3>
                        {criterion.description && (
                          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {criterion.description}
                          </p>
                        )}
                      </div>
                      {criterion.weight && (
                        <div className="flex-shrink-0">
                          <span className="inline-block rounded bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {criterion.weight}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      {criterion.type === "score" && criterion.scale ? (
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {Array.from(
                              { length: criterion.scale.max - criterion.scale.min + 1 },
                              (_, i) => criterion.scale.min + i
                            ).map((score) => (
                              <button
                                key={score}
                                onClick={() =>
                                  setRatings((prev) => ({
                                    ...prev,
                                    [criterion._id]: score,
                                  }))
                                }
                                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 font-bold transition text-sm sm:text-base ${
                                  ratings[criterion._id] === score
                                    ? "border-[#6CB33F] bg-[#6CB33F] text-white"
                                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:border-[#6CB33F]"
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {criterion.scale.min} = Faible | {criterion.scale.max} = Excellent
                          </p>
                        </div>
                      ) : criterion.type === "choice" &&
                        Array.isArray(criterion.choices) ? (
                        <select
                          value={ratings[criterion._id] || ""}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [criterion._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white transition focus:border-[#6CB33F] focus:outline-none"
                        >
                          <option value="">Sélectionner une option...</option>
                          {criterion.choices.map((choice, i) => (
                            <option key={i} value={choice}>
                              {choice}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          placeholder="Votre évaluation..."
                          value={ratings[criterion._id] || ""}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [criterion._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#6CB33F] focus:outline-none"
                          rows={3}
                        />
                      )}
                    </div>

                    {(criterion.type === "score" || criterion.type === "choice") && (
                      <div className="mt-3 sm:mt-4">
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <MessageSquare size={16} />
                          Commentaire (optionnel)
                        </label>
                        <textarea
                          placeholder="Ajouter un commentaire détaillé..."
                          value={comments[criterion._id] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({
                              ...prev,
                              [criterion._id]: e.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#6CB33F] focus:outline-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">❌ Aucun critère trouvé</p>
              )}
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800/80 p-4 sm:p-6 md:p-8 shadow-sm dark:border dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Évaluation générale
            </h3>

            <div className="mt-6">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Note globale (optionnel)
              </label>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="transition"
                  >
                    <Star
                      size={28}
                      className={`sm:w-8 sm:h-8 ${
                        star <= overallRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Observations supplémentaires
              </label>
              <textarea
                placeholder="Ajouter des notes finales, recommandations..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                className="mt-2 w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#6CB33F] focus:outline-none"
                rows={4}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl sm:rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 sm:p-4">
              <div className="flex gap-3">
                <AlertCircle size={20} className="flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-xl sm:rounded-2xl border-2 border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-3 sm:p-4">
              <div className="flex gap-3">
                <CheckCircle size={20} className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400">
                  ✅ Évaluation sauvegardée avec succès !
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 rounded-lg sm:rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
            >
              Annuler
            </button>

            <button
              onClick={handleSave}
              disabled={saving || criteria.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg sm:rounded-full bg-[#6CB33F] px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}