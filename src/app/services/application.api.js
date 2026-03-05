// =====================================================
// FRONTEND: services/application.api.js
// =====================================================
import api from "./api"; // votre instance axios

/** Candidature spontanée (FormData avec CV optionnel) */
export const createSpontaneousApplication = (formData) =>
  api.post("/applications/spontaneous", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** Liste toutes les candidatures spontanées + stagiaires (recruiter) */
export const getSpontaneousApplications = () =>
  api.get("/applications/spontaneous");

/** Détail d'une candidature */
export const getApplicationById = (id) =>
  api.get(`/applications/${id}`);

/** Mettre à jour le statut */
export const updateApplicationStatus = (id, status) =>
  api.put(`/applications/${id}/status`, { status });
/** Mettre à jour le statut */
export const confirmCandidature = (id, status) =>
  api.put(`/applications/${id}/status`, { status });
export const uploadCvToJob  = (id, status) =>
  api.put(`/applications/${id}/status`, { status });
