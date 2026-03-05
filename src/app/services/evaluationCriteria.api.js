import api from "./api";

/* ===================== FICHES ===================== */

export const getAllFiches = (params = {}) =>
  api.get("/evaluation/fiches", { params });

export const getActiveFiches = () =>
  api.get("/evaluation/fiches/active");

export const createFiche = (payload) =>
  api.post("/evaluation/fiches", payload);

export const updateFiche = (id, payload) => {
  if (!id || id === "undefined") {
    return Promise.reject(new Error("ID de fiche invalide"));
  }
  return api.patch(`/evaluation/fiches/${id}`, payload);
};

export const deleteFiche = (id) =>
  api.delete(`/evaluation/fiches/${id}`);

export const getFicheWithCriteria = (id) => {
  if (!id || id === "undefined") {
    return Promise.reject(new Error("ID de fiche invalide"));
  }
  return api.get(`/evaluation/fiches/${id}`);
};

/* ===================== CRITERIA ===================== */

export const getCriteriaByFiche = (ficheId, params = {}) =>
  api.get("/evaluation/criteria", {
    params: { ficheId, ...params },
  });

export const createCriterion = (payload) => {
  if (!payload.ficheId) {
    return Promise.reject(new Error("ficheId est obligatoire"));
  }
  return api.post("/evaluation/criteria", payload);
};

export const updateCriterion = (id, payload) => {
  if (!id || id === "undefined") {
    console.error("❌ ID du critère invalide:", id);
    return Promise.reject(new Error(`ID du critère invalide: ${id}`));
  }

  console.log("🔄 Mise à jour du critère:", { id, payload });
  return api.patch(`/evaluation/criteria/${id}`, payload).catch((error) => {
    console.error("❌ Erreur mise à jour critère:", error?.response?.data || error);
    throw error;
  });
};

export const deleteCriterion = (id) =>
  api.delete(`/evaluation/criteria/${id}`);

export const getActiveCriteria = (ficheId) =>
  api.get("/evaluation/criteria/active", {
    params: ficheId ? { ficheId } : {},
  });