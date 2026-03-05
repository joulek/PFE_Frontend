import api from "./api";

export const startSubmission = ({ ficheId, candidatureId }) =>
  api.post("/fiche-submissions/start", { ficheId, candidatureId });

export const addAnswer = (submissionId, payload) =>
  api.post(`/fiche-submissions/${submissionId}/answer`, payload);

export const submitSubmission = (submissionId) =>
  api.post(`/fiche-submissions/${submissionId}/submit`, {});

export const getSubmissionById = (submissionId) =>
  api.get(`/fiche-submissions/${submissionId}`);