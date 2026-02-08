"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  CheckCircle, 
  Edit, 
  MessageSquare,
  MapPin,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function RecruiterConfirmInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [action, setAction] = useState(null); // "confirm" or "modify"
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    confirmedDate: "",
    confirmedTime: "",
    notes: "",
    location: "",
  });

  useEffect(() => {
    loadInterview();
  }, [token]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/confirm/${token}`
      );
      const data = await response.json();

      if (data.success) {
        setInterview(data.data);
        setFormData({
          confirmedDate: data.data.proposedDate.split("T")[0],
          confirmedTime: data.data.proposedTime,
          notes: data.data.notes || "",
          location: "",
        });
      } else {
        setErrorMessage("Entretien introuvable");
      }
    } catch (error) {
      console.error("Error loading interview:", error);
      setErrorMessage("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/confirm/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Entretien confirmé avec succès! Le candidat a été notifié par email.");
        setTimeout(() => {
          router.push("/recruiter/dashboard");
        }, 2000);
      } else {
        setErrorMessage(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error confirming interview:", error);
      setErrorMessage("Erreur lors de la confirmation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModify = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/modify/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newDate: formData.confirmedDate,
            newTime: formData.confirmedTime,
            notes: formData.notes,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Demande de modification envoyée au recruteur pour validation.");
        setTimeout(() => {
          router.push("/recruiter/dashboard");
        }, 2000);
      } else {
        setErrorMessage(data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error modifying interview:", error);
      setErrorMessage("Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === "confirm") {
      handleConfirm();
    } else if (action === "modify") {
      handleModify();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate color from name
  const getAvatarColor = (name) => {
    if (!name) return "bg-gray-400";
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">Entretien introuvable</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const initials = getInitials(interview.candidateName);
  const avatarColor = getAvatarColor(interview.candidateName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-emerald-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[320px]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Succès!</p>
                <p className="text-sm opacity-95">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-red-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[320px]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Erreur!</p>
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4 transition-colors">
            <Calendar className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            Confirmation d'entretien
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Veuillez vérifier les informations ci-dessous et confirmer l'entretien.
          </p>
        </div>

        {/* Main Content */}
        {!action ? (
          <div className="space-y-6">
            {/* Candidate Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
              <div className="flex items-start gap-6">
                {/* Avatar with initials */}
                <div className="relative flex-shrink-0">
                  <div className={`w-24 h-24 ${avatarColor} rounded-2xl flex items-center justify-center`}>
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 transition-colors">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                    {interview.candidateName}
                  </h2>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-4 transition-colors">
                    Poste : {interview.jobTitle}
                  </p>

                  {/* Interview Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors">
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Date</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {new Date(interview.proposedDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors">
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Heure</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {interview.proposedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confirm Card */}
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
                      Confirmer l'entretien
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">
                      Validez cette date et cet horaire. Le candidat sera notifié.
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-100 dark:border-emerald-800 transition-colors">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Confirmer et notifier le candidat
                  </p>
                </div>
              </button>

              {/* Modify Card */}
              <button
                onClick={() => setAction("modify")}
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
                      Modifiez la date ou l'heure si nécessaire.
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-4 py-3 border border-orange-100 dark:border-orange-800 transition-colors">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Modifier la date/heure
                  </p>
                </div>
              </button>
            </div>

          </div>
        ) : (
          /* Form View */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
            {/* Back Button */}
            <button
              onClick={() => setAction(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>

            {/* Form Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {action === "confirm" ? (
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center transition-colors">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center transition-colors">
                    <Edit className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    {action === "confirm" ? "Confirmer l'entretien" : "Modifier l'entretien"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors">
                    {action === "confirm" 
                      ? "Validez les informations et ajoutez le lieu" 
                      : "Proposez une nouvelle date et heure pour cet entretien."}
                  </p>
                </div>
              </div>
            </div>

            {/* Interview Summary for Modify */}
            {action === "modify" && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-600 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${avatarColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg font-bold text-white">{initials}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                      Entretien - {interview.jobTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 transition-colors">
                      <Briefcase className="w-3 h-3 inline mr-1" />
                      {interview.candidateName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Date initiale: {new Date(interview.proposedDate).toLocaleDateString("fr-FR")} à {interview.proposedTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time Section */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 transition-colors">
                    {action === "modify" ? "Nouvelle proposition de date" : "Date et heure de l'entretien"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {action === "modify" ? "Choisir une nouvelle date" : "Date programmée"}
                    </label>
                    {action === "confirm" ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(formData.confirmedDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    ) : (
                      <>
                        <input
                          type="date"
                          name="confirmedDate"
                          value={formData.confirmedDate}
                          onChange={handleChange}
                          min={today}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Sélectionnez une date à partir d'aujourd'hui
                        </p>
                      </>
                    )}
                  </div>

                  {/* Time Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {action === "modify" ? "Créneau horaire" : "Heure programmée"}
                    </label>
                    {action === "confirm" ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-medium">
                        {formData.confirmedTime}
                      </div>
                    ) : (
                      <select
                        name="confirmedTime"
                        value={formData.confirmedTime}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                      >
                        <option value="">Sélectionner une heure</option>
                        <option value="08:00">08:00 - 09:00</option>
                        <option value="09:00">09:00 - 10:00</option>
                        <option value="10:00">10:00 - 11:00</option>
                        <option value="11:00">11:00 - 12:00</option>
                        <option value="14:00">14:00 - 15:00</option>
                        <option value="15:00">15:00 - 16:00</option>
                        <option value="16:00">16:00 - 17:00</option>
                        <option value="17:00">17:00 - 18:00</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason for modification (only for modify) */}
              {action === "modify" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Motif de la modification (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ex: Conflit avec une autre réunion, disponibilité de l'équipe..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  />
                </div>
              )}

              {/* Location (only for confirm) */}
              {action === "confirm" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Lieu de l'entretien
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Bureau 3A, Siège social, Visioconférence (lien Teams)..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-4 ${
                    action === "confirm" 
                      ? "bg-emerald-500 hover:bg-emerald-600" 
                      : "bg-orange-500 hover:bg-orange-600"
                  } text-white rounded-xl font-bold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      {action === "confirm" ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirmer et notifier
                        </>
                      ) : (
                        <>
                          <Edit className="w-5 h-5" />
                          Proposer cette date
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 transition-colors">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
                    {action === "confirm" 
                      ? "Le candidat recevra un email de confirmation avec tous les détails de l'entretien."
                      : "Votre demande sera envoyée au recruteur principal pour validation avant notification du candidat."
                    }
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}