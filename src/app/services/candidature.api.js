import api from "./api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getCondidature = () => api.get("/candidatures");
export const getCandidaturesWithJob = () => api.get("/candidatures/with-job");
export const getCondidatureCount = () => api.get("/candidatures/count");
export const getCandidaturesAnalysis = () => api.get("/candidatures/analysis");
export const getMyCandidatures = () => api.get("/candidatures/my");
export const getMyAnalysis = () => api.get("/candidatures/my-analysis");
export const getMyCandidaturesCreated = () => api.get("/candidatures/my-created");
export const getAnalysisNord = () => api.get("/candidatures/analysis-nord");
export const getMatchingStats = () => api.get("/candidatures/stats/matching");
export const getAcademicStats = () => api.get("/candidatures/stats/academic");

export const togglePreInterview = (id) =>
  api.patch(`/candidatures/${id}/pre-interview`);

export const getPreInterviewList = () =>
  api.get("/candidatures/pre-interview");

export const togglePreInterviewNord = (id) =>
  api.patch(`/candidatures/${id}/pre-interview-nord`);

export const getPreInterviewNordList = () =>
  api.get("/candidatures/pre-interview-nord");

export const sendDocuments = (candidatureId, payload) =>
  api.post(`/candidatures/${candidatureId}/send-documents`, payload);

export const getCandidatureById = (id) =>
  api.get(`/candidatures/${id}`);

export const getPreInterviewCandidates = async () => {
  const { data } = await axios.get(
    `${API_URL}/api/candidatures/preinterview`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return data;
};

// ─── DGA ──────────────────────────────────────────────────────
export async function getDgaMyInterviews({ page = 1, limit = 15, search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set("search", search.trim());
  const { data } = await api.get(`/api/interviews/dga/my-interviews?${params}`);
  return data;
}

export async function confirmDgaInterview(interviewId) {
  const { data } = await api.post(`/api/interviews/${interviewId}/confirm-dga`);
  return data;
}

// Notes DGA (liées à candidatureId via /api/interviews/:candidatureId/notes)
export async function getInterviewNotes(candidatureId) {
  const { data } = await api.get(`/api/interviews/${candidatureId}/notes`);
  return data;
}

export async function createInterviewNote(candidatureId, payload) {
  const { data } = await api.post(`/api/interviews/${candidatureId}/notes`, payload);
  return data;
}

export async function updateInterviewNote(candidatureId, noteId, payload) {
  const { data } = await api.patch(
    `/api/interviews/${candidatureId}/notes/${noteId}`,
    payload
  );
  return data;
}

export async function deleteInterviewNote(candidatureId, noteId) {
  const { data } = await api.delete(
    `/api/interviews/${candidatureId}/notes/${noteId}`
  );
  return data;
}

