// src/app/services/application.api.js

export const uploadCvToJob = async (jobId, file) => {
  const form = new FormData();
  form.append("cv", file);

  const res = await fetch(
    `http://localhost:5000/api/applications/${jobId}/cv`,
    {
      method: "POST",
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Upload échoué");
  }

  return data;
};

// ✅ NEW: confirm candidature (parsed + manual)
export const confirmCandidature = async (candidatureId, parsed, manual) => {
  const res = await fetch(
    `http://localhost:5000/api/applications/${candidatureId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parsed, manual }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Submit failed");
  }

  return data;
};
