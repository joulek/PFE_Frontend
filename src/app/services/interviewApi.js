import api from "./api";

/* ============================================================
 * INTERVIEW API SERVICE
 * ============================================================ */

/* ══════════════════════════════════════════════
 * ADMIN / RESPONSABLE / CANDIDAT EXISTANT
 * ══════════════════════════════════════════════ */

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

export async function getInterviewByToken(token) {
  const { data } = await api.get(`/api/interviews/confirm/${token}`);
  return data;
}

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

export async function modifyInterview(token, { newDate, newTime, notes }) {
  const { data } = await api.post(`/api/interviews/modify/${token}`, {
    newDate,
    newTime,
    notes,
  });
  return data;
}

export async function getCandidateInterview(candidateToken) {
  const { data } = await api.get(`/api/interviews/candidate/${candidateToken}`);
  return data;
}

export async function candidateConfirmInterview(candidateToken) {
  const { data } = await api.post(
    `/api/interviews/candidate/${candidateToken}/confirm`,
    {}
  );
  return data;
}

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

export async function adminApproveModification(interviewId) {
  const { data } = await api.post(
    `/api/interviews/admin/approve/${interviewId}`,
    {}
  );
  return data;
}

export async function adminRejectModification(interviewId, reason) {
  const { data } = await api.post(
    `/api/interviews/admin/reject/${interviewId}`,
    { reason }
  );
  return data;
}

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

export async function getInterviewsStats() {
  const { data } = await api.get("/api/interviews/admin/stats");
  return data;
}

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

export async function getMyInterviewsStats() {
  const { data } = await api.get("/api/interviews/responsable/my-stats");
  return data;
}



export async function saveRhNordNote(interviewId, text) {
  const { data } = await api.post(
    `/api/interviews/${interviewId}/rh-nord-note`,
    { text }
  );
  return data;
}

export async function getInterviewsByCandidature(candidatureId) {
  const { data } = await api.get(`/api/interviews/candidature/${candidatureId}`);
  return data;
}

export async function getInterviewsByJobOffer(jobOfferId) {
  const { data } = await api.get(`/api/interviews/job/${jobOfferId}`);
  return data;
}

export async function getInterviewsByUser(userId) {
  const { data } = await api.get(`/api/interviews/user/${userId}`);
  return data;
}

export async function getUpcomingInterviews() {
  const { data } = await api.get("/api/interviews/upcoming");
  return data;
}

export async function cancelInterview(interviewId, reason) {
  const { data } = await api.delete(`/api/interviews/${interviewId}`, {
    data: { reason },
  });
  return data;
}

export async function getMyTelephoniqueInterviews({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const { data } = await api.get(
    `/api/interviewNord/telephonique/my-list?${params}`
  );
  return data;
}

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


export async function deleteRhNordNote(interviewId) {
  return request(`/api/interviews/${interviewId}/rh-nord-note`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}


