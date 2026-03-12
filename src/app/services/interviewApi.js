// services/interviewApi.js
import api from "./api";

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
 *  4. Admin approuve/rejette      → adminApproveModification() / adminRejectModification()
 *  5. Admin liste & stats         → getAllInterviewsAdmin() / getInterviewsStats()
 *  6. ResponsableMetier liste     → getMyInterviews() / getMyInterviewsStats()
 *  7. RH Optylab notes            → saveRhNordNote() / deleteRhNordNote()
 *  8. RH Optylab liste confirmés  → getConfirmedInterviews()
 *
 * ============================================================ */

// ══════════════════════════════════════════════
//  ÉTAPE 1 : Admin planifie l'entretien
// ══════════════════════════════════════════════

/**
 * POST /api/interviews/schedule
 * ADMIN — Planifier un nouvel entretien
 */
export async function scheduleInterview({
  candidatureId,
  jobOfferId,
  candidateEmail,
  candidateName,
  proposedDate,
  proposedTime,
  notes,
}) {
  const { data } = await api.post("/api/interviews/schedule", {
    candidatureId,
    jobOfferId,
    candidateEmail,
    candidateName,
    proposedDate,
    proposedTime,
    notes,
  });
  return data;
}

// ══════════════════════════════════════════════
//  ÉTAPE 2 : ResponsableMetier
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/confirm/:token
 * Charger les détails de l'entretien (page responsable)
 */
export async function getInterviewByToken(token) {
  const { data } = await api.get(`/api/interviews/confirm/${token}`);
  return data;
}

/**
 * POST /api/interviews/confirm/:token
 * Responsable confirme la date
 */
export async function confirmInterview(
  token,
  { confirmedDate, confirmedTime, notes, location }
) {
  const { data } = await api.post(`/api/interviews/confirm/${token}`, {
    confirmedDate,
    confirmedTime,
    notes,
    location,
  });
  return data;
}

/**
 * POST /api/interviews/modify/:token
 * Responsable demande une modification (→ mail admin, PAS candidat)
 */
export async function modifyInterview(token, { newDate, newTime, notes }) {
  const { data } = await api.post(`/api/interviews/modify/${token}`, {
    newDate,
    newTime,
    notes,
  });
  return data;
}

// ══════════════════════════════════════════════
//  ÉTAPE 3 : Candidat
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/candidate/:token
 * Charger les détails de l'entretien (page candidat)
 */
export async function getCandidateInterview(candidateToken) {
  const { data } = await api.get(`/api/interviews/candidate/${candidateToken}`);
  return data;
}

/**
 * POST /api/interviews/candidate/:token/confirm
 * Candidat confirme l'entretien
 */
export async function candidateConfirmInterview(candidateToken) {
  const { data } = await api.post(
    `/api/interviews/candidate/${candidateToken}/confirm`,
    {}
  );
  return data;
}

/**
 * POST /api/interviews/candidate/:token/reschedule
 * Candidat propose une autre date
 */
export async function candidateReschedule(
  candidateToken,
  { proposedDate, proposedTime, reason }
) {
  const { data } = await api.post(
    `/api/interviews/candidate/${candidateToken}/reschedule`,
    {
      proposedDate,
      proposedTime,
      reason,
    }
  );
  return data;
}

// ══════════════════════════════════════════════
//  ADMIN : Gestion des modifications
// ══════════════════════════════════════════════

/**
 * POST /api/interviews/admin/approve/:id
 * Admin approuve la modification du responsable
 */
export async function adminApproveModification(interviewId) {
  const { data } = await api.post(
    `/api/interviews/admin/approve/${interviewId}`,
    {}
  );
  return data;
}

/**
 * POST /api/interviews/admin/reject/:id
 * Admin rejette la modification du responsable
 */
export async function adminRejectModification(interviewId, reason) {
  const { data } = await api.post(
    `/api/interviews/admin/reject/${interviewId}`,
    { reason }
  );
  return data;
}

// ══════════════════════════════════════════════
//  ADMIN : Liste complète des entretiens
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/admin/all
 * ADMIN ONLY — Liste paginée et enrichie de tous les entretiens
 *
 * @param {{ page?: number, limit?: number, status?: string, search?: string }} params
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
  });

  if (search.trim()) params.set("search", search.trim());

  const { data } = await api.get(`/api/interviews/admin/all?${params}`);
  return data;
}

/**
 * GET /api/interviews/admin/stats
 * ADMIN ONLY — Compteurs par statut pour le dashboard
 *
 * @returns {{ success, data: { TOTAL, CONFIRMED, PENDING_CONFIRMATION, ... } }}
 */
export async function getInterviewsStats() {
  const { data } = await api.get("/api/interviews/admin/stats");
  return data;
}

// ══════════════════════════════════════════════
//  RESPONSABLE METIER : Ses propres entretiens
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/responsable/my-interviews
 * RESPONSABLE_METIER ONLY — Liste paginée de ses entretiens assignés
 *
 * @param {{ page?: number, limit?: number, status?: string, search?: string }} params
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
  });

  if (search.trim()) params.set("search", search.trim());

  const { data } = await api.get(
    `/api/interviews/responsable/my-interviews?${params}`
  );
  return data;
}

/**
 * GET /api/interviews/responsable/my-stats
 * RESPONSABLE_METIER ONLY — Compteurs par statut de ses entretiens
 *
 * @returns {{ success, data: { TOTAL, CONFIRMED, PENDING_CONFIRMATION, ... } }}
 */
export async function getMyInterviewsStats() {
  const { data } = await api.get("/api/interviews/responsable/my-stats");
  return data;
}

// ══════════════════════════════════════════════
//  RESPONSABLE_RH_OPTYLAB : Entretiens confirmés
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/confirmed
 * Liste paginée des entretiens confirmés
 *
 * @param {{ page?: number, limit?: number, search?: string }} params
 * @returns {{ interviews, total, totalPages }}
 */
export async function getConfirmedInterviews({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const { data } = await api.get(`/api/interviews/confirmed?${params}`);
  return data;
}

// ══════════════════════════════════════════════
//  RESPONSABLE_RH_OPTYLAB : Notes sur entretien
// ══════════════════════════════════════════════

/**
 * POST /api/interviews/:id/rh-nord-note
 * Créer ou modifier une note RH
 */
export async function saveRhNordNote(interviewId, text) {
  const { data } = await api.post(
    `/api/interviews/${interviewId}/rh-nord-note`,
    { text }
  );
  return data;
}

/**
 * DELETE /api/interviews/:id/rh-nord-note
 * Supprimer la note RH
 */


// ══════════════════════════════════════════════
//  CONSULTATION
// ══════════════════════════════════════════════

/**
 * GET /api/interviews/candidature/:id
 * Entretiens par candidature
 */
export async function getInterviewsByCandidature(candidatureId) {
  const { data } = await api.get(
    `/api/interviews/candidature/${candidatureId}`
  );
  return data;
}

/**
 * GET /api/interviews/job/:id
 * Entretiens par offre d'emploi
 */
export async function getInterviewsByJobOffer(jobOfferId) {
  const { data } = await api.get(`/api/interviews/job/${jobOfferId}`);
  return data;
}

/**
 * GET /api/interviews/user/:id
 * Entretiens par utilisateur
 */
export async function getInterviewsByUser(userId) {
  const { data } = await api.get(`/api/interviews/user/${userId}`);
  return data;
}

/**
 * GET /api/interviews/upcoming
 * Entretiens à venir
 */
export async function getUpcomingInterviews() {
  const { data } = await api.get("/api/interviews/upcoming");
  return data;
}

// ══════════════════════════════════════════════
//  ANNULATION
// ══════════════════════════════════════════════

/**
 * DELETE /api/interviews/:id
 * Annuler un entretien
 */
export async function cancelInterview(interviewId, reason) {
  const { data } = await api.delete(`/api/interviews/${interviewId}`, {
    data: { reason },
  });
  return data;
}

// ══════════════════════════════════════════════
//  RH NORD — Entretiens téléphoniques confirmés
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
//  RESPONSABLE_RH_OPTYLAB — Note sur entretien confirmé
// ══════════════════════════════════════════════

/** Sauvegarder (créer ou modifier) une note */
export async function saveRhOptylabNote(interviewId, text) {
  return request(`/api/interviews/${interviewId}/rh-nord-note`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
}

/** Supprimer la note */
export async function deleteRhNordNote(interviewId) {
  return request(`/api/interviews/${interviewId}/rh-nord-note`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
// ══════════════════════════════════════════════
//  RH NORD — Entretiens téléphoniques confirmés
//  CORRECTION : gestion d'erreur robuste + fallback si 404
// ══════════════════════════════════════════════

/**
 * GET /interviewNord/telephonique/my-list
 *
 * ⚠️  IMPORTANT : vérifier dans server.js que le router est monté avec :
 *     app.route("/interviewNord", interviewNordRouter)
 *     (attention à la casse : N majuscule)
 */
export async function getMyTelephoniqueInterviews({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page:  String(page),
    limit: String(limit),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const url = `${API_BASE}/api/interviewNord/telephonique/my-list?${params}`;

  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // ✅ Vérifier le Content-Type avant de parser en JSON
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("❌ Réponse non-JSON reçue pour /telephonique/my-list:", response.status, text.slice(0, 200));
    throw new Error(`Endpoint introuvable (${response.status}) — vérifiez le montage du router dans server.js`);
  }

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.error || `Erreur ${response.status}`);
  }

  return response.json();
}