import axios from "axios";

const API_URL = "http://localhost:5000/fiches";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* CREATE */
export function createFiche(payload) {
  return axios.post(API_URL, payload, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
}

/* UPDATE ✅ */
export function updateFiche(id, payload) {
  return axios.put(`${API_URL}/${id}`, payload, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
}

/* GET ONE */
export function getFicheById(id) {
    console.log("GET FICHE ID =", id);

  return axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}
export async function saveFiche(payload, id = null) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  if (id) {
    // UPDATE
    return axios.put(`${API_URL}/${id}`, payload, { headers });
  }

  // CREATE
  return axios.post(API_URL, payload, { headers });
}
/* DELETE */
export function deleteFiche(id) {
  return axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}
export function getFiches() {
  return axios.get(API_URL, {
    headers: {
      ...getAuthHeaders(),
    },
  });
}