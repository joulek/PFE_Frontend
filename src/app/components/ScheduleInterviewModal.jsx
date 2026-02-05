"use client";

import { useState } from "react";
import { X, Calendar, Clock, MessageSquare, Send } from "lucide-react";

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  candidature,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposedDate: "",
    proposedTime: "",
    notes: "",
  });

  if (!isOpen) return null;

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Extraire et préparer les données importantes
    const candidatureId = candidature?._id;

    // Tentatives pour trouver jobOfferId
    const jobOfferId =
      candidature?.jobOfferId ||
      candidature?.analysis?.jobOfferId ||
      candidature?.jobId ||
      candidature?.analysis?.jobMatch?.jobOfferId ||
      "";

    // Tentatives pour trouver l'email du candidat
    const candidateEmail =
      candidature?.email ||
      candidature?.candidateEmail ||
      candidature?.analysis?.candidateEmail ||
      candidature?.extracted?.email ||
      candidature?.extracted?.manual?.email ||
      candidature?.extracted?.parsed?.email ||
      "";

    // Nom du candidat (avec plusieurs fallbacks)
    const candidateName =
      candidature?.fullName ||
      candidature?.analysis?.candidateName ||
      (candidature?.prenom && candidature?.nom
        ? `${candidature.prenom} ${candidature.nom}`.trim()
        : candidature?.nom ||
          candidature?.prenom ||
          "Candidat inconnu");

    // 2. Validation stricte avant envoi
    const errors = [];

    if (!candidatureId) errors.push("ID de la candidature manquant");
    if (!jobOfferId) errors.push("ID de l'offre d'emploi manquant");
    if (!candidateEmail) errors.push("Email du candidat manquant");
    if (!candidateName || candidateName === "Candidat inconnu") {
      console.warn("Nom du candidat non trouvé, utilisation de la valeur par défaut");
    }
    if (!formData.proposedDate) errors.push("Date proposée manquante");
    if (!formData.proposedTime) errors.push("Heure proposée manquante");

    if (errors.length > 0) {
      alert(`Impossible de planifier l'entretien :\n${errors.join("\n")}`);
      setLoading(false);
      return;
    }

    // 3. Préparer le payload
    const payload = {
      candidatureId,
      jobOfferId,
      candidateEmail,
      candidateName,
      proposedDate: formData.proposedDate,
      proposedTime: formData.proposedTime,
      notes: formData.notes || "",
    };

    // Log très détaillé pour le débogage
    console.log("📤 Tentative d’envoi – Données préparées :", {
      payload,
      candidatureOriginal: {
        _id: candidature?._id,
        jobOfferId: candidature?.jobOfferId,
        email: candidature?.email,
        candidateEmail: candidature?.candidateEmail,
        fullName: candidature?.fullName,
        nom: candidature?.nom,
        prenom: candidature?.prenom,
        analysisKeys: candidature?.analysis ? Object.keys(candidature.analysis) : null,
      },
    });

    // 4. Envoi de la requête
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ajoute ici ton token d'auth si nécessaire :
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 Statut de la réponse :", response.status);

    const data = await response.json();

    console.log("📥 Réponse du serveur :", data);

    if (response.ok && data.success) {
      alert("✅ Entretien planifié avec succès ! Un email a été envoyé au responsable.");
      onSuccess?.();
      onClose();
    } else {
      alert(`❌ Erreur : ${data.message || "Erreur serveur inconnue"}`);
      console.error("Erreur détaillée :", data);
    }
  } catch (error) {
    console.error("🚨 Erreur lors de la planification :", error);
    alert("Une erreur est survenue lors de la connexion au serveur.");
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Planifier Entretien
              </h2>
              <p className="text-green-50 text-sm mt-1">
                Pour {candidature.fullName || candidature.nom || "le candidat"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Information:</strong> Le responsable métier recevra un
              email pour confirmer ou modifier cette date.
            </p>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date proposée *
            </label>
            <input
              type="date"
              name="proposedDate"
              value={formData.proposedDate}
              onChange={handleChange}
              min={today}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          {/* Time Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Heure proposée *
            </label>
            <input
              type="time"
              name="proposedTime"
              value={formData.proposedTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Informations complémentaires pour le responsable..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Planifier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
