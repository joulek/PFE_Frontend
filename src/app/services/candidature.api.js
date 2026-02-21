import api from "./api";

export const getCondidature = () => api.get("/candidatures");
export const getCandidaturesWithJob = () => api.get("/candidatures/with-job");
export const getCondidatureCount = () => api.get("/candidatures/count");
export const getCandidaturesAnalysis = () => api.get("/candidatures/analysis");
export const getMyCandidatures = () => api.get("/candidatures/my");
export const getMatchingStats = () => api.get("/candidatures/stats/matching");
export const getAcademicStats = () => api.get("/candidatures/stats/academic");

// ── Pré-entretien ──────────────────────────────────────────────
export const togglePreInterview = (id) =>
  api.patch(`/candidatures/${id}/pre-interview`);

export const getPreInterviewList = () =>
  api.get("/candidatures/pre-interview");

// ── 🆕 Envoyer fiche + quiz ───────────────────────────────────
export const sendDocuments = (candidatureId, payload) =>
  api.post(`/candidatures/${candidatureId}/send-documents`, payload);