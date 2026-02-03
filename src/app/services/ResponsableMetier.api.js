import api from "./api";

/* =========================
   USERS (ADMIN)
========================= */

// GET all users
export const getUsers = () => api.get("/users");

// CREATE user
export const createUser = (payload) => api.post("/users/register", payload);

// UPDATE user role
export const updateUser = (id, data) =>
  api.patch(`/users/${id}`, data);


// DELETE user
export const deleteUser = (id) => api.delete(`/users/${id}`);
