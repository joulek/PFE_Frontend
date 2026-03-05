import api from "./api";

/** GET all (optionnel q=search) */
export const getEmployees = (q = "") =>
  api.get(`/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`);

/** GET by id */
export const getEmployeeById = (id) => api.get(`/employees/${id}`);

/** CREATE */
export const createEmployee = (payload) => api.post("/employees", payload);

/** UPDATE */
export const updateEmployee = (id, payload) => api.patch(`/employees/${id}`, payload);

/** DELETE */
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);