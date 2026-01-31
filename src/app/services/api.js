import axios from "axios";

const api = axios.create({
  baseURL: "/api",                // ⭐ IMPORTANT
  withCredentials: true,          // pour cookies si besoin
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter automatiquement le token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
