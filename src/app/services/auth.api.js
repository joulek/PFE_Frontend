// src/app/services/auth.api.js
import api from "./api";

export const logout = () => api.post("/users/logout");
