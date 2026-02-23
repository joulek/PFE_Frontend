import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  console.log("🔑 FRONT token exists?", !!token, token?.slice(0, 15));

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================================================
   PUBLIC — offres confirmées uniquement
========================================================= */

export function getJobs() {
  return axios.get(`${API_URL}/jobs`);
}

export function getActiveJobs() {
  return axios.get(`${API_URL}/jobs/active`);
}

export function getJobById(id) {
  return axios.get(`${API_URL}/jobs/${id}`);
}

/* =========================================================
   AUTHENTICATED — tout utilisateur connecté
========================================================= */

export function createJob(data) {
  return axios.post(`${API_URL}/jobs`, data, { headers: authHeaders() });
}

export function getMyOffers() {
  return axios.get(`${API_URL}/jobs/my-offers`, { headers: authHeaders() });
}

/** ✅ Modifier sa propre offre EN_ATTENTE */
export function updateMyJob(id, data) {
  return axios.put(`${API_URL}/jobs/my-offers/${id}`, data, { headers: authHeaders() });
}

/* =========================================================
   ADMIN ONLY
========================================================= */

export function getAllJobs() {
  return axios.get(`${API_URL}/jobs/all`, { headers: authHeaders() });
}

export function getPendingJobs() {
  return axios.get(`${API_URL}/jobs/pending`, { headers: authHeaders() });
}

export function getJobCount() {
  return axios.get(`${API_URL}/jobs/count`, { headers: authHeaders() });
}

export function getJobsWithCandidatureCount() {
  return axios.get(`${API_URL}/jobs/with-candidatures-count`, { headers: authHeaders() });
}

export function updateJob(id, data) {
  return axios.put(`${API_URL}/jobs/${id}`, data, { headers: authHeaders() });
}

export function deleteJob(id) {
  return axios.delete(`${API_URL}/jobs/${id}`, { headers: authHeaders() });
}

export function confirmJob(id) {
  return axios.put(`${API_URL}/jobs/${id}/confirm`, {}, { headers: authHeaders() });
}

export function rejectJob(id, reason) {
  return axios.put(`${API_URL}/jobs/${id}/reject`, reason ? { reason } : {}, { headers: authHeaders() });
}

export function checkJobClosed(id) {
  return axios.get(`${API_URL}/jobs/${id}/is-closed`);
}

export function getJobsByUser(userId) {
  return axios.get(`${API_URL}/jobs/user/${userId}`, { headers: authHeaders() });
}
export function reactivateJob(id, newDateCloture) {
  return axios.put(
    `${API_URL}/jobs/${id}/reactivate`,
    { newDateCloture },
    { headers: authHeaders() }
  );
}


export function publishJobToLinkedIn(id, text) {
  return axios.post(
    `${API_URL}/jobs/${id}/publish-linkedin`,
    text ? { text } : {},
    { headers: authHeaders() }
  );
}

export async function redirectToLinkedInConnect() {
  const res = await getLinkedInAuthUrl();
  window.location.href = res.data.url;
}
export async function getLinkedInAuthUrl() {
  return axios.get(`${API_URL}/linkedin/auth-url`, { headers: authHeaders() });
}