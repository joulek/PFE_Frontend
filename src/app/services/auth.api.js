// src/app/services/auth.api.js
import api from "./api";

export const login = (email, password) =>
  api.post("/users/login", { email, password });

export const logout = () => api.post("/users/logout");

// Password reset APIs
export const forgotPassword = (email) =>
  api.post("/password/forgot", { email });

export const verifyResetCode = (email, code) =>
  api.post("/password/verify-code", { email, code });

export const resetPassword = (email, code, newPassword, confirmPassword) =>
  api.post("/password/reset", { email, code, newPassword, confirmPassword });

export const resendCode = (email) =>
  api.post("/password/resend-code", { email });