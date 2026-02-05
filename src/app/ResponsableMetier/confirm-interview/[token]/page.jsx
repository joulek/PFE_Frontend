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
  ArrowLeft 
} from "lucide-react";

export default function ConfirmInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [action, setAction] = useState(null); // "confirm" or "modify"
  const [submitting, setSubmitting] = useState(false);

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
        // Pre-fill form with proposed date/time
        setFormData({
          confirmedDate: data.data.proposedDate.split("T")[0],
          confirmedTime: data.data.proposedTime,
          notes: data.data.notes || "",
          location: "",
        });
      } else {
        alert("Entretien introuvable");
      }
    } catch (error) {
      console.error("Error loading interview:", error);
      alert("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
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
        alert("✅ Entretien confirmé! Le candidat a été notifié par email.");
        router.push("/dashboard");
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error("Error confirming interview:", error);
      alert("❌ Erreur lors de la confirmation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModify = async () => {
    setSubmitting(true);
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
        alert("✅ Entretien modifié! Le candidat a été notifié.");
        router.push("/dashboard");
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error("Error modifying interview:", error);
      alert("❌ Erreur lors de la modification");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-300">Entretien introuvable</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Confirmation d'Entretien
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Veuillez confirmer ou modifier la date proposée
          </p>
        </div>

        {/* Interview Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-green-500" />
            Détails de l'Entretien
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Candidat</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {interview.candidateName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {interview.candidateEmail}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Poste</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {interview.jobTitle}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date proposée initialement</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(interview.proposedDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Heure proposée</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {interview.proposedTime}
                </p>
              </div>
            </div>

            {interview.notes && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-gray-700 dark:text-gray-200">{interview.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Selection */}
        {!action && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Que souhaitez-vous faire ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setAction("confirm")}
                className="flex items-center gap-3 p-6 border-2 border-green-500 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Confirmer</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    La date convient
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAction("modify")}
                className="flex items-center gap-3 p-6 border-2 border-orange-500 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors group"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                  <Edit className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Modifier</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Proposer une autre date
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation/Modification Form */}
        {action && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
            <button
              onClick={() => setAction(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {action === "confirm" ? "Confirmer l'entretien" : "Modifier la date"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date {action === "modify" ? "modifiée" : "confirmée"} *
                </label>
                <input
                  type="date"
                  name="confirmedDate"
                  value={formData.confirmedDate}
                  onChange={handleChange}
                  min={today}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Heure {action === "modify" ? "modifiée" : "confirmée"} *
                </label>
                <input
                  type="time"
                  name="confirmedTime"
                  value={formData.confirmedTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              {/* Location (only for confirmation) */}
              {action === "confirm" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Lieu de l'entretien
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Bureau 3A, Siège social"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Notes pour le candidat
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Informations complémentaires..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full px-6 py-4 ${
                  action === "confirm" 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-orange-500 hover:bg-orange-600"
                } text-white rounded-lg font-bold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2`}
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
                        Confirmer l'Entretien
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        Modifier l'Entretien
                      </>
                    )}
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {action === "confirm" 
                  ? "Le candidat recevra un email de confirmation" 
                  : "Le candidat sera notifié de la nouvelle date"}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}