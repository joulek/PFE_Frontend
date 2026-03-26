// =====================================================
// FRONTEND: services/application.api.js
// =====================================================
import api from "./api"; // votre instance axios

/** Candidature spontanée (FormData avec CV optionnel) */
export const createSpontaneousApplication = (formData) =>
  api.post("/api/applications/spontaneous", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** ✅ Postuler à un stage lié à une offre (FormData avec CV optionnel) */
export const applyToStage = (jobId, formData) =>
  api.post(`/api/applications/stage/${jobId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** Liste toutes les candidatures spontanées + stagiaires (recruiter) */
export const getSpontaneousApplications = () =>
  api.get("/api/applications/spontaneous");

/** Détail d'une candidature */
export const getApplicationById = (id) =>
  api.get(`/api/applications/${id}`);

/** ✅ Mettre à jour le statut d'une candidature */
export const updateApplicationStatus = (id, status) =>
  api.patch(`/api/applications/${id}/status`, { status });

export const uploadCvToJob = async (jobId, file) => {
  const form = new FormData();
  form.append("cv", file);

  const res = await fetch(
    `http://localhost:5000/api/applications/${jobId}/cv`,
    {
      method: "POST",
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Upload échoué");
  }

  return data;
};

export const confirmCandidature = async (
  candidatureId,
  parsed,
  manual,
  personalInfoForm
) => {
  const res = await fetch(
    `http://localhost:5000/api/applications/${candidatureId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed, manual, personalInfoForm }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    // ✅ FIX: on attache status + data à l'erreur pour que StepManual
    // puisse détecter le code ALREADY_SUBMITTED et afficher le bon message
    const err = new Error(data.message || "Submit failed");
    err.status = res.status;   // ← 409
    err.data   = data;         // ← { code: "ALREADY_SUBMITTED", message: "..." }
    throw err;
  }

  return data;
};

// ✅ update infos personnelles du candidat
export const updatePersonalInfo = async (candidatureId, personalInfoForm) => {
  const res = await fetch(
    `http://localhost:5000/candidatures/${candidatureId}/personal-info`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(personalInfoForm),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Update personal info failed");
  }

  return data;
};