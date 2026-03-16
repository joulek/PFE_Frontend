"use client";

import { useEffect, useMemo, useState } from "react";
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
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

function hasMeaningfulValue(value, type) {
  if (type === "score") {
    return value !== null && value !== undefined && value !== "";
  }
  if (type === "boolean" || type === "choice") {
    return String(value || "").trim() !== "";
  }
  return String(value || "").trim() !== "";
}

function RadioCard({ checked, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
        checked
          ? "border-[#7CC242] bg-[#F3FBEA] dark:border-[#7CC242] dark:bg-[#7CC242]/10"
          : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#7CC242]/60"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
          checked
            ? "border-[#7CC242] bg-[#7CC242]"
            : "border-gray-400 dark:border-white/30"
        }`}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
      </span>

      <span className="text-[16px] font-medium text-[#0B1220] dark:text-white">
        {label}
      </span>
    </button>
  );
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

        const formData = await apiFetch(
          `/api/interviews/${interviewId}/evaluation-form`,
        );

        setInterview(formData?.interview || null);
        setFiche(formData?.fiche || null);

        const sortedCriteria = Array.isArray(formData?.criteria)
          ? [...formData.criteria].sort(
              (a, b) =>
                Number(a?.order ?? 0) - Number(b?.order ?? 0) ||
                String(a?.label || "").localeCompare(String(b?.label || "")),
            )
          : [];

        setCriteria(sortedCriteria);

        if (formData?.existingEvaluation) {
          const existingEval = formData.existingEvaluation;
          setOverallRating(existingEval?.overallRating || 0);
          setEvaluationNotes(existingEval?.notes || "");

          const newRatings = {};
          const newComments = {};

          (existingEval?.ratings || []).forEach((r) => {
            newRatings[r.criterionId] = r.value;
            newComments[r.criterionId] = r.comment || "";
          });

          setRatings(newRatings);
          setComments(newComments);
        }
      } catch (err) {
        setError(
          "Impossible de charger la fiche d'évaluation : " + err.message,
        );
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [interviewId]);

  const completion = useMemo(() => {
    if (!criteria.length) return 0;
    const filled = criteria.filter((criterion) =>
      hasMeaningfulValue(ratings[criterion._id], criterion.type),
    ).length;
    return Math.round((filled / criteria.length) * 100);
  }, [criteria, ratings]);

  const updateRating = (criterionId, value) => {
    setRatings((prev) => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  const updateComment = (criterionId, value) => {
    setComments((prev) => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!fiche?._id) {
        throw new Error("Fiche d'évaluation introuvable");
      }

      const evaluationData = {
        ficheId: fiche._id,
        ratings: criteria.map((crit) => ({
          criterionId: crit._id,
          label: crit.label,
          value:
            ratings[crit._id] !== undefined && ratings[crit._id] !== null
              ? ratings[crit._id]
              : "",
          comment: comments[crit._id] || "",
          type: crit.type,
        })),
        notes: evaluationNotes,
        overallRating,
      };

      await apiFetch(`/api/interviews/${interviewId}/evaluation`, {
        method: "POST",
        body: JSON.stringify(evaluationData),
      });

      setSuccess(true);

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setError("Erreur lors de la sauvegarde de l'évaluation : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] px-6 py-8 dark:from-[#0B1220] dark:to-[#0F1A2B]">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader size={40} className="animate-spin text-[#7CC242]" />
            <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">
              Chargement...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] px-6 py-8 dark:from-[#0B1220] dark:to-[#0F1A2B]">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-[#7CC242] hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
            <div className="flex gap-4">
              <AlertCircle size={24} className="flex-shrink-0 text-red-500" />
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                  Erreur
                </h2>
                <p className="mt-1 text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] px-6 py-8 dark:from-[#0B1220] dark:to-[#0F1A2B]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#7CC242] transition hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-2xl bg-white p-8 shadow-sm dark:border dark:border-white/10 dark:bg-[#0F1A2B]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Candidat
                </p>
                <h1 className="mt-2 text-2xl font-bold text-[#0B1220] dark:text-white">
                  {interview?.candidateName}
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {interview?.candidateEmail}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Type d'entretien
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#7CC242]/50 bg-[#7CC242]/10 px-4 py-1 text-sm font-semibold text-[#7CC242] dark:border-[#7CC242]/30 dark:bg-[#7CC242]/5">
                    {interview?.interviewType || "Entretien RH"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  📋 {fiche?.name}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                    Date proposée
                  </p>
                  <p className="mt-1 text-[#0B1220] dark:text-white">
                    {interview?.proposedDate
                      ? new Date(interview.proposedDate).toLocaleDateString(
                          "fr-FR",
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                    Heure
                  </p>
                  <p className="mt-1 text-[#0B1220] dark:text-white">
                    {interview?.proposedTime || "-"}
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm dark:border dark:border-white/10 dark:bg-[#0F1A2B]">
            <h2 className="text-xl font-bold text-[#0B1220] dark:text-white">
              {fiche?.description || "Critères d'évaluation"}
            </h2>

            <div className="mt-8 space-y-8">
              {criteria && criteria.length > 0 ? (
                criteria.map((criterion, idx) => (
                  <div
                    key={criterion._id}
                    className="border-b border-gray-100 pb-8 last:border-b-0 dark:border-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0B1220] dark:text-white">
                          {idx + 1}. {criterion.label}
                        </h3>
                        {criterion.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {criterion.description}
                          </p>
                        )}
                      </div>

                      {criterion.weight && (
                        <div className="flex-shrink-0">
                          <span className="inline-block rounded bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                            Poids: {criterion.weight}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      {criterion.type === "score" && criterion.scale ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {Array.from(
                              {
                                length:
                                  Number(criterion.scale.max) -
                                    Number(criterion.scale.min) +
                                  1,
                              },
                              (_, i) => Number(criterion.scale.min) + i,
                            ).map((score) => (
                              <button
                                key={score}
                                type="button"
                                onClick={() => updateRating(criterion._id, score)}
                                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition ${
                                  ratings[criterion._id] === score
                                    ? "border-[#7CC242] bg-[#7CC242] text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-[#7CC242] dark:border-white/20 dark:bg-white/5 dark:text-white"
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {criterion.scale.min} = Faible | {criterion.scale.max} =
                            Excellent
                          </p>
                        </div>
                      ) : criterion.type === "boolean" ? (
                        <div className="space-y-3">
                          <RadioCard
                            label="Oui"
                            checked={ratings[criterion._id] === "Oui"}
                            onClick={() => updateRating(criterion._id, "Oui")}
                          />
                          <RadioCard
                            label="Non"
                            checked={ratings[criterion._id] === "Non"}
                            onClick={() => updateRating(criterion._id, "Non")}
                          />
                        </div>
                      ) : criterion.type === "choice" &&
                        Array.isArray(criterion.choices) ? (
                        <div className="space-y-3">
                          {criterion.choices.map((choice, i) => (
                            <RadioCard
                              key={i}
                              label={choice}
                              checked={ratings[criterion._id] === choice}
                              onClick={() => updateRating(criterion._id, choice)}
                            />
                          ))}
                        </div>
                      ) : (
                        <textarea
                          placeholder="Votre évaluation..."
                          value={ratings[criterion._id] || ""}
                          onChange={(e) =>
                            updateRating(criterion._id, e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[#0B1220] placeholder-gray-400 transition focus:border-[#7CC242] focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                          rows={3}
                        />
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <MessageSquare size={16} />
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        placeholder="Ajouter un commentaire détaillé..."
                        value={comments[criterion._id] || ""}
                        onChange={(e) =>
                          updateComment(criterion._id, e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-[#0B1220] placeholder-gray-400 transition focus:border-[#7CC242] focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                        rows={2}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-red-600 dark:text-red-400">
                  Aucun critère trouvé
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm dark:border dark:border-white/10 dark:bg-[#0F1A2B]">
            <h3 className="text-lg font-bold text-[#0B1220] dark:text-white">
              Évaluation générale
            </h3>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Note globale (optionnel)
              </label>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="transition"
                  >
                    <Star
                      size={32}
                      className={
                        star <= overallRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-white/20"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Observations supplémentaires
              </label>
              <textarea
                placeholder="Ajouter des notes finales, recommandations..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[#0B1220] placeholder-gray-400 transition focus:border-[#7CC242] focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                rows={4}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
              <div className="flex gap-3">
                <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
              <div className="flex gap-3">
                <CheckCircle
                  size={20}
                  className="flex-shrink-0 text-green-600 dark:text-green-400"
                />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Évaluation sauvegardée avec succès.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 rounded-full border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-[#0B1220] transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/20 dark:bg-[#0F1A2B] dark:text-white dark:hover:bg-white/5"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || criteria.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#7CC242] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer l'évaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}