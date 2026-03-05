import api from "./api";

/* CREATE */
export const createFiche = (payload) => api.post("/fiches", payload);

/* UPDATE */
export const updateFiche = (id, payload) => api.put(`/fiches/${id}`, payload);

/* GET ONE */
export const getFicheById = (id) => api.get(`/fiches/${id}`);

/* SAVE (CREATE OR UPDATE) */
export const saveFiche = (payload, id = null) =>
  id ? api.put(`/fiches/${id}`, payload) : api.post("/fiches", payload);

/* DELETE */
export const deleteFiche = (id) => api.delete(`/fiches/${id}`);

/* GET ALL */
export const getFiches = () => api.get("/fiches");