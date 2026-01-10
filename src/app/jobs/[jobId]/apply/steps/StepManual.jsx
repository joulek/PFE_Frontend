"use client";
import { useState } from "react";

export default function StepManual({ parsedCV, cvFileUrl, onBack, onSubmit }) {
  const [form, setForm] = useState(parsedCV);

  /* ===== HANDLERS ===== */

  const updateEducation = (index, field, value) => {
    const updated = [...form.education];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, education: updated });
  };

  const updateExperience = (index, field, value) => {
    const updated = [...form.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, experiences: updated });
  };

  // ✅ STYLE INPUT EXACT COMME LOGIN
  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl " +
    "focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] " +
    "outline-none transition";

  return (
    <div className="w-full px-6 md:px-12 xl:px-24 space-y-10">
      {/* ===== HEADER ===== */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Étape 2 — Vérification & Complément
        </h2>
        <p className="text-sm text-gray-600">
          CV uploadé :
          <a
            href={`http://localhost:5000${cvFileUrl}`}
            target="_blank"
            className="text-green-600 underline ml-1"
          >
            Voir le CV
          </a>
        </p>
      </div>

      {/* ===== GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===== INFOS PERSONNELLES ===== */}
        <Card title="Informations personnelles">
          <input
            className={`${inputClass} mb-3`}
            value={form.fullName || ""}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
            placeholder="Nom complet"
          />

          <input
            className={inputClass}
            value={form.email || ""}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="Email"
          />
        </Card>

        {/* ===== FORMATION ===== */}
        <Card title="Formation">
          {form.education?.map((edu, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50"
            >
              <input
                className={`${inputClass} mb-2`}
                value={edu.degree || ""}
                onChange={(e) =>
                  updateEducation(i, "degree", e.target.value)
                }
                placeholder="Diplôme"
              />

              <input
                className={`${inputClass} mb-2`}
                value={edu.institution || ""}
                onChange={(e) =>
                  updateEducation(i, "institution", e.target.value)
                }
                placeholder="Établissement"
              />

              <input
                className={inputClass}
                value={edu.period || ""}
                onChange={(e) =>
                  updateEducation(i, "period", e.target.value)
                }
                placeholder="Période"
              />
            </div>
          ))}
        </Card>

        {/* ===== EXPERIENCES ===== */}
        <Card title="Expériences professionnelles" className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.experiences?.map((exp, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                <input
                  className={`${inputClass} mb-2`}
                  value={exp.role || ""}
                  onChange={(e) =>
                    updateExperience(i, "role", e.target.value)
                  }
                  placeholder="Poste / Rôle"
                />

                <input
                  className={`${inputClass} mb-2`}
                  value={exp.company || ""}
                  onChange={(e) =>
                    updateExperience(i, "company", e.target.value)
                  }
                  placeholder="Entreprise"
                />

                <input
                  className={`${inputClass} mb-2`}
                  value={exp.period || ""}
                  onChange={(e) =>
                    updateExperience(i, "period", e.target.value)
                  }
                  placeholder="Période"
                />

                <textarea
                  rows={3}
                  className={inputClass}
                  value={(exp.description || []).join("\n")}
                  onChange={(e) =>
                    updateExperience(
                      i,
                      "description",
                      e.target.value.split("\n")
                    )
                  }
                  placeholder="Description (une ligne par point)"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
        >
          ← Retour
        </button>

        <button
          onClick={() => {
            if (typeof onSubmit === "function") onSubmit(form);
          }}
          className="px-6 py-3 rounded-xl bg-[#6CB33F] hover:bg-[#4E8F2F] text-white transition"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

/* ===== CARD ===== */
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
