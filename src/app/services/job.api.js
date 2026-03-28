import api from "./api";

/* =========================
   JOBS PUBLIC
========================= */

export function getJobs() {
  return api.get("/jobs");
}

export function getActiveJobs() {
  return api.get("/jobs/active");
}

export function getJobById(id) {
  return api.get(`/jobs/${id}`);
}

/* =========================
   JOBS AUTH
========================= */

export function createJob(data) {
  return api.post("/jobs", data);
}

export function getMyOffers() {
  return api.get("/jobs/my-offers");
}

export function updateMyJob(id, data) {
  return api.put(`/jobs/my-offers/${id}`, data);
}

export function getMyAssignedJobs() {
  return api.get("/jobs/my-assigned");
}

export function getMyJobsWithoutQuiz() {
  return api.get("/jobs/without-quiz");
}

/* =========================
   ADMIN / SHARED JOBS
========================= */

export function getAllJobs() {
  return api.get("/jobs/all");
}

export function getPendingJobs() {
  return api.get("/jobs/pending");
}

export function getJobCount() {
  return api.get("/jobs/count");
}

export function getJobsWithCandidatureCount() {
  return api.get("/jobs/with-candidatures-count");
}

export function getJobsByUser(userId) {
  return api.get(`/jobs/user/${userId}`);
}

export function updateJob(id, data) {
  return api.put(`/jobs/${id}`, data);
}

export function deleteJob(id) {
  return api.delete(`/jobs/${id}`);
}

/* =========================
   JOB STATUS
========================= */

export function confirmJob(id) {
  return api.put(`/jobs/${id}/confirm`, {});
}

export function rejectJob(id, reason) {
  return api.put(`/jobs/${id}/reject`, reason ? { reason } : {});
}

export function validateJob(id) {
  return api.put(`/jobs/${id}/validate`, {});
}

export function reactivateJob(id, newDateCloture) {
  return api.put(`/jobs/${id}/reactivate`, { newDateCloture });
}

export function checkJobClosed(id) {
  return api.get(`/jobs/${id}/is-closed`);
}

/* =========================
   LINKEDIN
========================= */

export function publishJobOnLinkedIn(jobId, formData) {
  return api.post(`/jobs/${jobId}/publish-linkedin`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function checkLinkedInStatus() {
  return api.get("/linkedin/status");
}

export function getLinkedInAuthUrl(returnJobId = null) {
  const params = returnJobId ? `?returnJobId=${returnJobId}` : "";
  return api.get(`/linkedin/auth-url${params}`);
}

export function confirmLinkedInToken(memberId) {
  return api.post("/linkedin/confirm-token", { memberId });
}
export function deleteMyJob(id) {
  return api.delete(`/jobs/my-offers/${id}`);
}
export function exchangeLinkedInCode(code, state) {
  return api.post("/linkedin/exchange-code", { code, state });
}

/* =========================
   RECRUITMENT TRACKING
========================= */

export function getRecruitmentTracking() {
  return api.get("/jobs/tracking");
}

export function getRecruitmentTrackingPaginated(page = 1, limit = 20) {
  return api.get(`/jobs/tracking/paginated?page=${page}&limit=${limit}`);
}

export function getRecruitmentTrackingFiltered(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/jobs/tracking/filtered?${params}`);
}

export function getRecruitmentStats() {
  return api.get("/jobs/tracking/stats");
}