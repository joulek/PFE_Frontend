import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================================================
   PUBLIC — offres confirmées uniquement
========================================================= */

/** GET /jobs — offres confirmées (public) */
export function getJobs() {
  return axios.get(`${API_URL}/jobs`);
}

/** GET /jobs/active — offres confirmées + non expirées */
export function getActiveJobs() {
  return axios.get(`${API_URL}/jobs/active`);
}

/** GET /jobs/:id */
export function getJobById(id) {
  return axios.get(`${API_URL}/jobs/${id}`);
}

/* =========================================================
   AUTHENTICATED — tout utilisateur connecté
========================================================= */

/** POST /jobs — créer une offre (ADMIN → CONFIRMEE, autre → EN_ATTENTE) */
export function createJob(data) {
  return axios.post(`${API_URL}/jobs`, data, { headers: authHeaders() });
}

/** GET /jobs/my-offers — mes offres créées */
export function getMyOffers() {
  return axios.get(`${API_URL}/jobs/my-offers`, { headers: authHeaders() });
}

/* =========================================================
   ADMIN ONLY
========================================================= */

/** GET /jobs/all — toutes les offres (tous statuts) */
export function getAllJobs() {
  return axios.get(`${API_URL}/jobs/all`, { headers: authHeaders() });
}

/** GET /jobs/pending — offres en attente de confirmation */
export function getPendingJobs() {
  return axios.get(`${API_URL}/jobs/pending`, { headers: authHeaders() });
}

/** GET /jobs/count — comptage par statut */
export function getJobCount() {
  return axios.get(`${API_URL}/jobs/count`, { headers: authHeaders() });
}

/** GET /jobs/with-candidatures-count */
export function getJobsWithCandidatureCount() {
  return axios.get(`${API_URL}/jobs/with-candidatures-count`, {
    headers: authHeaders(),
  });
}

/** PUT /jobs/:id — modifier une offre */
export function updateJob(id, data) {
  return axios.put(`${API_URL}/jobs/${id}`, data, { headers: authHeaders() });
}

/** DELETE /jobs/:id — supprimer une offre */
export function deleteJob(id) {
  return axios.delete(`${API_URL}/jobs/${id}`, { headers: authHeaders() });
}

/** PUT /jobs/:id/confirm — confirmer une offre (admin) */
export function confirmJob(id) {
  return axios.put(`${API_URL}/jobs/${id}/confirm`, {}, { headers: authHeaders() });
}

/** PUT /jobs/:id/reject — rejeter une offre (admin), body.reason optionnel */
export function rejectJob(id, reason) {
  return axios.put(
    `${API_URL}/jobs/${id}/reject`,
    reason ? { reason } : {},
    { headers: authHeaders() }
  );
}

/** GET /jobs/:id/is-closed */
export function checkJobClosed(id) {
  return axios.get(`${API_URL}/jobs/${id}/is-closed`);
}

/** GET /jobs/user/:userId */
export function getJobsByUser(userId) {
  return axios.get(`${API_URL}/jobs/user/${userId}`, {
    headers: authHeaders(),
  });
}