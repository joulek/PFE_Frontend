const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
 *  INTERVIEW API SERVICE
 * ============================================================
 *
 *  FLOW :
 *  1. Admin planifie              → scheduleInterview()
 *  2. ResponsableMetier confirme  → confirmInterview()
 *  2b. ResponsableMetier modifie  → modifyInterview() → mail admin
 *  3. Candidat confirme           → candidateConfirmInterview()
 *  3b. Candidat propose date      → candidateReschedule()
 *  4. Admin approuve/rejette      → adminApprove() / adminReject()
 *  5. Admin liste & stats         → getAllInterviewsAdmin() / getInterviewsStats()
 *  6. ResponsableMetier liste     → getMyInterviews() / getMyInterviewsStats()
 *
 * ============================================================ */

// ──────────────────────────────────────────────
//  Helper : fetch wrapper
// ──────────────────────────────────────────────
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json();
  return data;
}

// Helper pour récupérer le token auth
function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ══════════════════════════════════════════════
//  ÉTAPE 1 : Admin planifie l'entretien
// ══════════════════════════════════════════════
export async function scheduleInterview({
  candidatureId,
  jobOfferId,
  candidateEmail,
  candidateName,
  proposedDate,
  proposedTime,
  notes,
}) {
  return request("/api/interviews/schedule", {
    method: "POST",
    body: JSON.stringify({
      candidatureId,
      jobOfferId,
      candidateEmail,
      candidateName,
      proposedDate,
      proposedTime,
      notes,
    }),
  });
}

// ══════════════════════════════════════════════
//  ÉTAPE 2 : ResponsableMetier
// ══════════════════════════════════════════════

/** GET - Charger les détails de l'entretien (page responsable) */
export async function getInterviewByToken(token) {
  return request(`/api/interviews/confirm/${token}`);
}

/** POST - Responsable confirme la date */
export async function confirmInterview(token, { confirmedDate, confirmedTime, notes, location }) {
  return request(`/api/interviews/confirm/${token}`, {
    method: "POST",
    body: JSON.stringify({ confirmedDate, confirmedTime, notes, location }),
  });
}

/** POST - Responsable demande une modification (→ mail admin, PAS candidat) */
export async function modifyInterview(token, { newDate, newTime, notes }) {
  return request(`/api/interviews/modify/${token}`, {
    method: "POST",
    body: JSON.stringify({ newDate, newTime, notes }),
  });
}

// ══════════════════════════════════════════════
//  ÉTAPE 3 : Candidat
// ══════════════════════════════════════════════

/** GET - Charger les détails (page candidat) */
export async function getCandidateInterview(candidateToken) {
  return request(`/api/interviews/candidate/${candidateToken}`);
}

/** POST - Candidat confirme l'entretien */
export async function candidateConfirmInterview(candidateToken) {
  return request(`/api/interviews/candidate/${candidateToken}/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** POST - Candidat propose une autre date */
export async function candidateReschedule(candidateToken, { proposedDate, proposedTime, reason }) {
  return request(`/api/interviews/candidate/${candidateToken}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ proposedDate, proposedTime, reason }),
  });
}

// ══════════════════════════════════════════════
//  ADMIN : Gestion des modifications
// ══════════════════════════════════════════════

/** POST - Admin approuve la modification du responsable */
export async function adminApproveModification(interviewId) {
  return request(`/api/interviews/admin/approve/${interviewId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** POST - Admin rejette la modification du responsable */
export async function adminRejectModification(interviewId, reason) {
  return request(`/api/interviews/admin/reject/${interviewId}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ══════════════════════════════════════════════
//  ADMIN : Liste complète des entretiens
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/admin/all
 * ADMIN ONLY — Liste paginée et enrichie de tous les entretiens
 *
 * @param {object} params
 * @param {number}  params.page        - Numéro de page (défaut : 1)
 * @param {number}  params.limit       - Résultats par page (défaut : 20, max : 200)
 * @param {string}  params.status      - Filtrer par statut, ex: "CONFIRMED" | "ALL"
 * @param {string}  params.search      - Recherche par nom / email / poste
 *
 * @returns {{ success, interviews, total, page, totalPages }}
 */
export async function getAllInterviewsAdmin({
  page = 1,
  limit = 20,
  status = "ALL",
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  return request(`/api/interviews/admin/all?${params}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * GET /api/interviews/admin/stats
 * ADMIN ONLY — Compteurs par statut pour le dashboard
 *
 * @returns {{ success, data: { TOTAL, CONFIRMED, PENDING_CONFIRMATION, ... } }}
 */
export async function getInterviewsStats() {
  return request("/api/interviews/admin/stats", {
    headers: getAuthHeaders(),
  });
}

// ══════════════════════════════════════════════
//  RESPONSABLE METIER : Ses propres entretiens
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/responsable/my-interviews
 * RESPONSABLE_METIER ONLY — Liste paginée de ses entretiens assignés
 *
 * @param {object} params
 * @param {number}  params.page    - Numéro de page (défaut : 1)
 * @param {number}  params.limit   - Résultats par page (défaut : 10)
 * @param {string}  params.status  - Filtrer par statut, ex: "CONFIRMED" | "ALL"
 * @param {string}  params.search  - Recherche par nom / email / poste
 *
 * @returns {{ success, interviews, total, page, totalPages }}
 */
export async function getMyInterviews({
  page = 1,
  limit = 10,
  status = "ALL",
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  return request(`/api/interviews/responsable/my-interviews?${params}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * GET /api/interviews/responsable/my-stats
 * RESPONSABLE_METIER ONLY — Compteurs par statut de ses entretiens
 *
 * @returns {{ success, data: { TOTAL, CONFIRMED, PENDING_CONFIRMATION, ... } }}
 */
export async function getMyInterviewsStats() {
  return request("/api/interviews/responsable/my-stats", {
    headers: getAuthHeaders(),
  });
}

// ══════════════════════════════════════════════
//  CONSULTATION
// ══════════════════════════════════════════════

/** Entretiens par candidature */
export async function getInterviewsByCandidature(candidatureId) {
  return request(`/api/interviews/candidature/${candidatureId}`);
}

/** Entretiens par offre */
export async function getInterviewsByJobOffer(jobOfferId) {
  return request(`/api/interviews/job/${jobOfferId}`);
}

/** Entretiens par utilisateur */
export async function getInterviewsByUser(userId) {
  return request(`/api/interviews/user/${userId}`);
}

/** Entretiens à venir */
export async function getUpcomingInterviews() {
  return request(`/api/interviews/upcoming`);
}

// ══════════════════════════════════════════════
//  ANNULATION
// ══════════════════════════════════════════════

/** Annuler un entretien */
export async function cancelInterview(interviewId, reason) {
  return request(`/api/interviews/${interviewId}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}