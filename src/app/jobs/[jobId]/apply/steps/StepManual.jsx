"use client";
import { useState } from "react";

export default function StepManual({
  jobId,
  candidatureId,
  parsedCV,
  cvFileUrl,
  onBack,
}) {
  // نحط parsedCV في state باش نعدّل فيه
  const [form, setForm] = useState(parsedCV);

  /* ======================
     HANDLERS
  ====================== */

  const updateExperience = (index, field, value) => {
    const updated = [...form.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, experiences: updated });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...form.education];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, education: updated });
  };

  /* ======================
     RENDER 
  ====================== */

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Étape 2 — Vérification & Complément
      </h2>

      {/* ===== CV LINK ===== */}
      <p className="mb-6 text-sm">
        CV uploadé :{" "}
        <a
          href={`http://localhost:5000${cvFileUrl}`}
          target="_blank"
          className="text-blue-600 underline"
        >
          Voir le CV
        </a>
      </p>

      {/* ===== BASIC INFO ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          className="border p-2 rounded"
          value={form.fullName || ""}
          onChange={(e) =>
            setForm({ ...form, fullName: e.target.value })
          }
          placeholder="Nom complet"
        />

        <input
          className="border p-2 rounded"
          value={form.email || ""}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          placeholder="Email"
        />
      </div>

      {/* ======================
         EXPERIENCES
      ====================== */}
      <h3 className="font-semibold mb-2">Expériences professionnelles</h3>

      {form.experiences?.map((exp, i) => (
        <div
          key={i}
          className="border rounded p-4 mb-4 bg-gray-50"
        >
          <input
            className="border p-2 rounded w-full mb-2"
            value={exp.role || ""}
            onChange={(e) =>
              updateExperience(i, "role", e.target.value)
            }
            placeholder="Poste / Rôle"
          />

          <input
            className="border p-2 rounded w-full mb-2"
            value={exp.company || ""}
            onChange={(e) =>
              updateExperience(i, "company", e.target.value)
            }
            placeholder="Entreprise / Lieu"
          />

          <input
            className="border p-2 rounded w-full mb-2"
            value={exp.period || ""}
            onChange={(e) =>
              updateExperience(i, "period", e.target.value)
            }
            placeholder="Période"
          />

          <textarea
            className="border p-2 rounded w-full"
            rows={3}
            value={(exp.description || []).join("\n")}
            onChange={(e) =>
              updateExperience(i, "description", e.target.value.split("\n"))
            }
            placeholder="Description (une ligne par point)"
          />
        </div>
      ))}

      {/* ======================
         EDUCATION
      ====================== */}
      <h3 className="font-semibold mb-2 mt-6">Formation</h3>

      {form.education?.map((edu, i) => (
        <div
          key={i}
          className="border rounded p-4 mb-4 bg-gray-50"
        >
          <input
            className="border p-2 rounded w-full mb-2"
            value={edu.degree || ""}
            onChange={(e) =>
              updateEducation(i, "degree", e.target.value)
            }
            placeholder="Diplôme"
          />

          <input
            className="border p-2 rounded w-full mb-2"
            value={edu.institution || ""}
            onChange={(e) =>
              updateEducation(i, "institution", e.target.value)
            }
            placeholder="Établissement"
          />

          <input
            className="border p-2 rounded w-full mb-2"
            value={edu.period || ""}
            onChange={(e) =>
              updateEducation(i, "period", e.target.value)
            }
            placeholder="Période"
          />
        </div>
      ))}

      {/* ======================
         ACTIONS
      ====================== */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded"
        >
          Retour
        </button>

        <button
          className="px-6 py-2 bg-green-600 text-white rounded"
          onClick={() => {
            console.log("FINAL DATA:", form);
            alert("Candidature prête à être envoyée ✔️");
          }}
        >
          Envoyer la candidature
        </button>
      </div>
    </div>
  );
}
