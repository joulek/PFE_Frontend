"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";  // ✅ AJOUTER useParams
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Star,
  MessageSquare,
  FileText,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ;


function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  console.log("🔑 Token:", token ? "OUI ✅" : "NON ❌");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  console.log("🌐 API CALL:", options.method || "GET", path);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    console.log("📡 Response status:", res.status);
    console.log("📡 Response ok:", res.ok);

    if (!res.ok) {
      console.error("❌ HTTP Error:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Response data:", data);
    return data;
  } catch (err) {
    console.error("❌ apiFetch ERROR:", err);
    throw err;
  }
}

export default function InterviewEvaluationPage() {
  const router = useRouter();
  const params = useParams();  // ✅ UTILISER useParams() hook
  const interviewId = params?.id;

  console.log("🔴 PAGE MOUNTED - params:", params);
  console.log("🔴 PAGE MOUNTED - interviewId:", interviewId);

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Données
  const [interview, setInterview] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [criteria, setCriteria] = useState([]);
  
  // Évaluation
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const [evaluationNotes, setEvaluationNotes] = useState("");

  // Charge les données
  useEffect(() => {
    console.log("🔴 USEEFFECT - LOAD FORM START");
    
    if (!interviewId) {
      console.error("❌ NO INTERVIEW ID");
      setError("ID d'entretien manquant");
      setLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📌 Loading form for interviewId:", interviewId);

        // Récupérer la fiche et les critères
        const url = `/api/interviews/${interviewId}/evaluation-form`;
        console.log("🌐 Calling URL:", url);
        
        const formData = await apiFetch(url);
        
        console.log("✅ Form data reçue:", formData);
        
        if (!formData) {
          throw new Error("No data received from API");
        }

        console.log("📋 Interview:", formData.interview);
        console.log("📊 Fiche:", formData.fiche);
        console.log("✏️ Criteria count:", formData.criteria?.length);

        setInterview(formData.interview);
        setFiche(formData.fiche);
        setCriteria(formData.criteria || []);

        // Chercher une évaluation existante
        if (formData.existingEvaluation) {
          console.log("📝 Existing evaluation found");
          const existingEval = formData.existingEvaluation;
          setOverallRating(existingEval.overallRating || 0);
          setEvaluationNotes(existingEval.notes || "");

          // Remplir les ratings et commentaires
          const newRatings = {};
          const newComments = {};
          existingEval.ratings.forEach((r) => {
            console.log("   - Criterion:", r.label, "=", r.value);
            newRatings[r.criterionId] = r.value;
            newComments[r.criterionId] = r.comment || "";
          });
          setRatings(newRatings);
          setComments(newComments);
        } else {
          console.log("📝 No existing evaluation");
        }

        console.log("🟢 FORM LOADED SUCCESSFULLY");
      } catch (err) {
        console.error("❌ ERREUR LOAD FORM:", err);
        console.error("Stack:", err.stack);
        setError("Impossible de charger la fiche d'évaluation: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [interviewId]);

  // Sauvegarde l'évaluation
  const handleSave = async () => {
    console.log("🔴 SAVE START");
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

      console.log("💾 Saving evaluation data:", evaluationData);

      const url = `/api/interviews/${interviewId}/evaluation`;
      console.log("🌐 Calling URL:", url);
      
      const result = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(evaluationData),
      });

      console.log("✅ Save result:", result);
      setSuccess(true);
      
      setTimeout(() => {
        console.log("↩️ Redirecting...");
        router.back();
      }, 2000);
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      setError("Erreur lors de la sauvegarde de l'évaluation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  console.log("🔵 RENDER - loading:", loading, "error:", error);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-[#0B1220] dark:to-[#0F1A2B] px-6 py-8">
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
      <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-[#0B1220] dark:to-[#0F1A2B] px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-[#7CC242] hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6">
            <div className="flex gap-4">
              <AlertCircle size={24} className="flex-shrink-0 text-red-500" />
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                  Erreur
                </h2>
                <p className="mt-1 text-red-600 dark:text-red-300">{error}</p>
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  Vérifiez la console (F12) pour plus de détails
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAF2] to-[#E8F5E1] dark:from-[#0B1220] dark:to-[#0F1A2B] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#7CC242] transition hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Retour
          </button>

          <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] p-8 shadow-sm dark:border dark:border-white/10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Candidat */}
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

              {/* Type d'entretien */}
              <div>
                <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Type d'entretien
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#7CC242]/50 dark:border-[#7CC242]/30 bg-[#7CC242]/10 dark:bg-[#7CC242]/5 px-4 py-1 text-sm font-semibold text-[#7CC242]">
                    {interview?.interviewType || "Entretien RH"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  📋 {fiche?.name}
                </p>
              </div>
            </div>

            {/* Détails entretien */}
            <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                    Date proposée
                  </p>
                  <p className="mt-1 text-[#0B1220] dark:text-white">
                    {interview?.proposedDate
                      ? new Date(interview.proposedDate).toLocaleDateString("fr-FR")
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

        {/* FICHE D'ÉVALUATION */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] p-8 shadow-sm dark:border dark:border-white/10">
            <h2 className="text-xl font-bold text-[#0B1220] dark:text-white">
              {fiche?.description || "Critères d'évaluation"}
            </h2>

            {/* CRITÈRES */}
            <div className="mt-8 space-y-8">
              {criteria && criteria.length > 0 ? (
                criteria.map((criterion, idx) => (
                  <div
                    key={criterion._id}
                    className="border-b border-gray-100 dark:border-white/5 pb-8 last:border-b-0"
                  >
                    {/* LABEL ET TYPE */}
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
                          <span className="inline-block rounded bg-gray-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Poids: {criterion.weight}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* INPUT SELON LE TYPE */}
                    <div className="mt-4">
                      {criterion.type === "score" && criterion.scale ? (
                        // INPUT SCORE (1-5)
                        <div className="space-y-3">
                          <div className="flex gap-2">
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
                                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition ${
                                  ratings[criterion._id] === score
                                    ? "border-[#7CC242] bg-[#7CC242] text-white"
                                    : "border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-gray-700 dark:text-white hover:border-[#7CC242]"
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
                      ) : criterion.type === "choice" &&
                        Array.isArray(criterion.choices) ? (
                        // SELECT MULTIPLE CHOICE
                        <select
                          value={ratings[criterion._id] || ""}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [criterion._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 text-[#0B1220] dark:text-white transition focus:border-[#7CC242] focus:outline-none"
                        >
                          <option value="">Sélectionner une option...</option>
                          {criterion.choices.map((choice, i) => (
                            <option key={i} value={choice}>
                              {choice}
                            </option>
                          ))}
                        </select>
                      ) : (
                        // TEXT AREA (défaut)
                        <textarea
                          placeholder="Votre évaluation..."
                          value={ratings[criterion._id] || ""}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [criterion._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 text-[#0B1220] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#7CC242] focus:outline-none"
                          rows={3}
                        />
                      )}
                    </div>

                    {/* COMMENTAIRE */}
                    {(criterion.type === "score" || criterion.type === "choice") && (
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                          className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-2 text-sm text-[#0B1220] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#7CC242] focus:outline-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-red-600 dark:text-red-400">❌ Aucun critère trouvé</p>
              )}
            </div>
          </div>

          {/* ÉVALUATION GÉNÉRALE ET NOTES */}
          <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] p-8 shadow-sm dark:border dark:border-white/10">
            <h3 className="text-lg font-bold text-[#0B1220] dark:text-white">
              Évaluation générale
            </h3>

            {/* NOTE GLOBALE */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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

            {/* NOTES FINALES */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Observations supplémentaires
              </label>
              <textarea
                placeholder="Ajouter des notes finales, recommandations..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 text-[#0B1220] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-[#7CC242] focus:outline-none"
                rows={4}
              />
            </div>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="rounded-2xl border-2 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="flex-shrink-0 text-red-500"
                />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4">
              <div className="flex gap-3">
                <CheckCircle
                  size={20}
                  className="flex-shrink-0 text-green-600 dark:text-green-400"
                />
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✅ Évaluation sauvegardée avec succès !
                </p>
              </div>
            </div>
          )}

          {/* BOUTONS ACTION */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 rounded-full border-2 border-gray-300 dark:border-white/20 bg-white dark:bg-[#0F1A2B] px-6 py-3 font-semibold text-[#0B1220] dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60"
            >
              Annuler
            </button>

            <button
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