import api from "./api";

/** ✅ Récupérer tous les quiz */
export const getAllQuizzes = () => api.get("/quizzes");

/** Récupérer le quiz d'une offre */
export const getQuizByJob = (jobId) => api.get(`/quizzes/job/${jobId}`);

/** Récupérer un quiz par ID */
export const getQuizById = (id) => api.get(`/quizzes/${id}`);

/** Générer un quiz pour une offre */
export const generateQuiz = (jobId) => api.post(`/quizzes/generate/${jobId}`);

/** Regénérer le quiz d'une offre */
export const regenerateQuiz = (jobId) => api.post(`/quizzes/regenerate/${jobId}`);

/** Modifier tout le quiz */
export const updateQuiz = (id, questions) =>
  api.put(`/quizzes/${id}`, { questions });

/** Modifier une question */
export const updateQuestion = (quizId, order, data) =>
  api.put(`/quizzes/${quizId}/questions/${order}`, data);

/** Supprimer une question */
export const deleteQuestion = (quizId, order) =>
  api.delete(`/quizzes/${quizId}/questions/${order}`);

/** Ajouter une question */
export const addQuestion = (quizId, data) =>
  api.post(`/quizzes/${quizId}/questions`, data);

/** Supprimer un quiz complet */
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
