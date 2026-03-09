// services/interview.evaluation.api.js
// Client API pour les évaluations d'entretiens

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const INTERVIEWS_ENDPOINT = `${API_URL}/interviews`;

/**
 * ✅ Récupérer la fiche d'évaluation et les critères pour un entretien
 */
export async function getEvaluationForm(interviewId) {
  try {
    const response = await axios.get(
      `${INTERVIEWS_ENDPOINT}/${interviewId}/evaluation-form`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erreur récupération fiche d'évaluation:", error);
    throw error;
  }
}

/**
 * ✅ Sauvegarder une évaluation d'entretien
 */
export async function saveEvaluation(interviewId, evaluationData) {
  try {
    const response = await axios.post(
      `${INTERVIEWS_ENDPOINT}/${interviewId}/evaluation`,
      evaluationData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erreur sauvegarde évaluation:", error);
    throw error;
  }
}

/**
 * ✅ Mettre à jour une évaluation existante
 */
export async function updateEvaluation(interviewId, evaluationData) {
  try {
    const response = await axios.patch(
      `${INTERVIEWS_ENDPOINT}/${interviewId}/evaluation`,
      evaluationData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erreur mise à jour évaluation:", error);
    throw error;
  }
}

/**
 * ✅ Récupérer une évaluation existante
 */
export async function getEvaluation(interviewId) {
  try {
    const response = await axios.get(
      `${INTERVIEWS_ENDPOINT}/${interviewId}/evaluation`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Pas d'évaluation existante
    }
    console.error("Erreur récupération évaluation:", error);
    throw error;
  }
}