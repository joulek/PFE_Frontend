import api from "./api";

export const getCondidature = () => api.get("/candidatures");




export const getCondidatureCount = () => api.get("/candidatures/count");


