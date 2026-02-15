"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Briefcase,
  CheckCircle,
  Edit,
  MessageSquare,
  MapPin,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  CalendarClock,
  PartyPopper,
} from "lucide-react";
import {
  getCandidateInterview,
  candidateConfirmInterview,
  candidateReschedule,
} from "../../../services/interviewApi";

export default function CandidateInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const candidateToken = params.candidateToken;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [action, setAction] = useState(null); // null | "confirm" | "reschedule"
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [done, setDone] = useState(false); // après succès final

  const [formData, setFormData] = useState({
    proposedDate: "",
    proposedTime: "",
    reason: "",
  });

  useEffect(() => {
    loadInterview();
  }, [candidateToken]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await getCandidateInterview(candidateToken);

      if (data.success) {
        setInterview(data.data);

        // Si déjà confirmé ou autre status
        if (data.data.status === "CONFIRMED") {
          setDone(true);
          setSuccessMessage("Votre entretien est déjà confirmé !");
        } else if (data.data.status === "CANDIDATE_REQUESTED_RESCHEDULE") {
          setDone(true);
          setSuccessMessage(
            "Votre demande de report a déjà été envoyée. L'administration vous recontactera."
          );
        }
      } else {
        setErrorMessage("Entretien introuvable ou lien expiré");
      }
    } catch (error) {
      console.error("Error loading interview:", error);
      setErrorMessage("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ── Candidat confirme ──
  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const data = await candidateConfirmInterview(candidateToken);

      if (data.success) {
        setDone(true);
        setSuccessMessage(
          "Entretien confirmé avec succès ! Nous vous attendons avec impatience."
        );
      } else {
        setErrorMessage(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error confirming:", error);
      setErrorMessage("Erreur lors de la confirmation");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Candidat propose autre date ──
  const handleReschedule = async () => {
    if (!formData.proposedDate || !formData.proposedTime) {
      setErrorMessage("Veuillez choisir une date et une heure");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const data = await candidateReschedule(candidateToken, {
        proposedDate: formData.proposedDate,
        proposedTime: formData.proposedTime,
        reason: formData.reason,
      });

      if (data.success) {
        setDone(true);
        setSuccessMessage(
          "Votre demande de report a été envoyée. L'administration vous recontactera avec une nouvelle date."
        );
      } else {
        setErrorMessage(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error rescheduling:", error);
      setErrorMessage("Erreur lors de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === "confirm") {
      handleConfirm();
    } else if (action === "reschedule") {
      handleReschedule();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Helpers UI ──
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "bg-gray-400";
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const today = new Date().toISOString().split("T")[0];

  // ══════════════════════════════════════════════
  //  LOADING STATE
  // ══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Chargement de votre entretien...
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  ERROR STATE (no interview)
  // ══════════════════════════════════════════════
  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mb-2">
            Entretien introuvable
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ce lien est peut-être expiré ou invalide. Veuillez contacter
            l'administration.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  SUCCESS STATE (done)
  // ══════════════════════════════════════════════
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6 transition-colors">
            <PartyPopper className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Merci !
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center gap-3 justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {successMessage}
              </p>
            </div>
            {interview.status !== "CANDIDATE_REQUESTED_RESCHEDULE" && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 transition-colors">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  <strong>Rappel :</strong> Pensez à arriver 10 minutes en
                  avance et à apporter une copie de votre CV.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const initials = getInitials(interview.candidateName);
  const avatarColor = getAvatarColor(interview.candidateName);

  // ══════════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* ── Toast Error ── */}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-red-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[320px]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Erreur</p>
                <p className="text-sm opacity-95">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4 transition-colors">
            <CalendarClock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            Votre entretien
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Confirmez votre disponibilité ou proposez une autre date.
          </p>
        </div>

        {/* ════════════════════════════════════════
            VUE INITIALE : choix confirm / reschedule
        ════════════════════════════════════════ */}
        {!action ? (
          <div className="space-y-6">
            {/* ── Détails de l'entretien ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-24 h-24 ${avatarColor} rounded-2xl flex items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-white">
                      {initials}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 transition-colors">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Bonjour,
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                    {interview.candidateName}
                  </h2>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-4 transition-colors">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Poste : {interview.jobTitle}
                  </p>

                  {/* Détails grille */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors">
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                          Date
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {new Date(interview.confirmedDate).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors">
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                          Heure
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {interview.confirmedTime}
                        </p>
                      </div>
                    </div>

                    {interview.notes && (
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors">
                        <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                            Notes
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                            {interview.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cartes d'action ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confirmer */}
              <button
                onClick={() => setAction("confirm")}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200 p-8 text-left"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                      Je confirme ma présence
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">
                      Cette date et cet horaire me conviennent parfaitement.
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800 transition-colors">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Confirmer l'entretien
                  </p>
                </div>
              </button>

              {/* Proposer autre date */}
              <button
                onClick={() => setAction("reschedule")}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transition-all duration-200 p-8 text-left"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <Edit className="w-7 h-7 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                      Proposer une autre date
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">
                      Cette date ne me convient pas, je souhaite proposer un
                      autre créneau.
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-4 py-3 border border-orange-100 dark:border-orange-800 transition-colors">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Demander un report
                  </p>
                </div>
              </button>
            </div>

            {/* Conseil */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 transition-colors">
                ✨ Conseils pour réussir votre entretien
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Arrivez 10 minutes en avance",
                  "Apportez une copie de votre CV",
                  "Préparez des questions sur le poste",
                  "Renseignez-vous sur l'entreprise",
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ════════════════════════════════════════
              VUE FORMULAIRE
          ════════════════════════════════════════ */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
            {/* Retour */}
            <button
              onClick={() => {
                setAction(null);
                setErrorMessage(null);
              }}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>

            {/* ── CONFIRM VIEW ── */}
            {action === "confirm" && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center transition-colors">
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                        Confirmer votre entretien
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 transition-colors">
                        Vérifiez les informations ci-dessous
                      </p>
                    </div>
                  </div>
                </div>

                {/* Récap */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-8 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">
                        Poste
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                        {interview.jobTitle}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">
                        Date & Heure
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                        {new Date(interview.confirmedDate).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}{" "}
                        à {interview.confirmedTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAction(null)}
                    className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirmation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Je confirme ma présence
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── RESCHEDULE VIEW ── */}
            {action === "reschedule" && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center transition-colors">
                      <CalendarClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                        Proposer une autre date
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 transition-colors">
                        Choisissez un créneau qui vous convient mieux
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rappel date actuelle */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 border border-gray-200 dark:border-gray-600 transition-colors">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${avatarColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-lg font-bold text-white">
                        {initials}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                        {interview.jobTitle}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Date actuelle :{" "}
                        {new Date(interview.confirmedDate).toLocaleDateString(
                          "fr-FR"
                        )}{" "}
                        à {interview.confirmedTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date & Heure */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                      <h3 className="font-bold text-amber-900 dark:text-amber-300 transition-colors">
                        Votre proposition
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Date souhaitée
                        </label>
                        <input
                          type="date"
                          name="proposedDate"
                          value={formData.proposedDate}
                          onChange={handleChange}
                          min={today}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        />
                      </div>

                      {/* Heure */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Créneau horaire
                        </label>
                        <select
                          name="proposedTime"
                          value={formData.proposedTime}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        >
                          <option value="">Sélectionner une heure</option>
                          <option value="09:00">09:00 - 10:00</option>
                          <option value="10:00">10:00 - 11:00</option>
                          <option value="11:00">11:00 - 12:00</option>
                          <option value="14:00">
                            14:00 - 15:00 (Après-midi)
                          </option>
                          <option value="15:00">
                            15:00 - 16:00 (Après-midi)
                          </option>
                          <option value="16:00">
                            16:00 - 17:00 (Après-midi)
                          </option>
                          <option value="17:00">
                            17:00 - 18:00 (Après-midi)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Raison */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Raison du report (optionnel)
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ex: J'ai un engagement professionnel ce jour-là et ne serai pas disponible..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAction(null);
                        setErrorMessage(null);
                      }}
                      className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Edit className="w-5 h-5" />
                          Envoyer ma proposition
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 transition-colors">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
                        Votre demande sera transmise à l'administration.
                        Vous recevrez un email dès qu'une nouvelle date sera
                        validée.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}