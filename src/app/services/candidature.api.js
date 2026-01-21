import api from "./api";

export const getCondidature = () => api.get("/candidatures");

export const getCandidaturesWithJob = () => api.get("/candidatures/with-job");


export const getCondidatureCount = () => api.get("/candidatures/count");


export const getCandidaturesAnalysis = () => api.get("/candidatures/analysis");
