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

export const confirmCandidature = async (
  candidatureId,
  parsed,
  manual,
  personalInfoForm
) => {
  const res = await fetch(
    `http://localhost:5000/api/applications/${candidatureId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed, manual, personalInfoForm }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submit failed");
  return data;
};


// ✅ NEW: update infos personnelles du candidat
export const updatePersonalInfo = async (candidatureId, personalInfoForm) => {
  const res = await fetch(
    `http://localhost:5000/candidatures/${candidatureId}/personal-info`
    , {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(personalInfoForm),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Update personal info failed");
  }

  return data;
};
