"use client";
import { useState } from "react";

/* =======================
   UTILITIES
======================= */

function extractPeriod(text = "") {
  const m = text.match(
    /(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|\d{4}).{0,15}(\d{4}|En cours)/i
  );
  return m ? m[0] : "";
}

function extractSchool(text = "") {
  if (!text) return "";
  if (text.toLowerCase().includes("sfax")) return "ISET Sfax";
  return "";
}

function extractDegree(text = "") {
  return text
    .replace(/Septembre.*|Spécialité.*/gi, "")
    .trim();
}

function extractRole(text = "") {
  if (text.includes("Projet Freelance")) return "Développeuse Full Stack";
  if (text.includes("Stage")) return "Stagiaire Développeuse Web";
  if (text.includes("Application Web")) return "Développeuse Web";
  return "Développeuse";
}

function extractBullets(text = "") {
  return text
    .split("\n")
    .filter((l) => l.trim().startsWith("•"))
    .map((l) => l.replace("•", "").trim());
}

function cleanCompany(c = "") {
  return c.replace("ACTIVITÉS", "").replace(/\n/g, "").trim();
}

/* =======================
   COMPONENT
======================= */

export default function StepManual({ parsedCV, cvFileUrl, onBack, onSubmit }) {
  const [form, setForm] = useState(() => ({
    fullName: parsedCV?.fullName || "",
    email: parsedCV?.email || "",
    phone: parsedCV?.phone || "",
    linkedin: parsedCV?.linkedin || "",
    github: parsedCV?.github || "",

    education: (parsedCV?.education || []).map((e) => ({
      degree: extractDegree(e.degree),
      institution: extractSchool(e.school || e.degree),
      period: extractPeriod(e.degree),
    })),
    
    skills: (parsedCV?.skills || []).filter(
      (s) =>
        s.length < 40 &&
        !s.toLowerCase().includes("cursus") &&
        !s.toLowerCase().includes("master") &&
        !s.toLowerCase().includes("licence")
    ),

    experiences: (parsedCV?.work_experience || []).map((e) => ({
      role: extractRole(e.description),
      company: cleanCompany(e.company),
      period: extractPeriod(e.description || e.period),
      description: extractBullets(e.description),
    })),
  }));

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl " +
    "focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] outline-none transition";

  const updateEducation = (i, f, v) => {
    const e = [...form.education];
    e[i] = { ...e[i], [f]: v };
    setForm({ ...form, education: e });
  };

  const updateExperience = (i, f, v) => {
    const e = [...form.experiences];
    e[i] = { ...e[i], [f]: v };
    setForm({ ...form, experiences: e });
  };

  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-10">

        <h2 className="text-3xl font-bold">Étape 2 — Vérification & Complément</h2>

        <a
          href={`http://localhost:5000${cvFileUrl}`}
          target="_blank"
          className="text-green-700 underline"
        >
          Voir le CV
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ========= PERSONAL INFO ========= */}
          <Card title="Informations personnelles">
            <input
              className={`${inputClass} mb-3`}
              placeholder="Nom complet"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />
            <input
              className={`${inputClass} mb-3`}
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <input
              className={`${inputClass} mb-3`}
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
            <input
              className={`${inputClass} mb-3`}
              placeholder="LinkedIn"
              value={form.linkedin}
              onChange={(e) =>
                setForm({ ...form, linkedin: e.target.value })
              }
            />
            <input
              className={inputClass}
              placeholder="GitHub"
              value={form.github}
              onChange={(e) =>
                setForm({ ...form, github: e.target.value })
              }
            />
          </Card>

          {/* ========= EDUCATION ========= */}
          <Card title="Formation">
            {form.education.map((edu, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-xl mb-4">
                <input
                  className={`${inputClass} mb-2`}
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducation(i, "degree", e.target.value)
                  }
                  placeholder="Diplôme"
                />
                <input
                  className={`${inputClass} mb-2`}
                  value={edu.institution}
                  onChange={(e) =>
                    updateEducation(i, "institution", e.target.value)
                  }
                  placeholder="Établissement"
                />
                <input
                  className={inputClass}
                  value={edu.period}
                  onChange={(e) =>
                    updateEducation(i, "period", e.target.value)
                  }
                  placeholder="Période"
                />
              </div>
            ))}
          </Card>
            {/* ===== SKILLS ===== */}
          <Card title="Compétences (Skills)">
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s,i)=>(
                <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* ========= EXPERIENCE ========= */}
          <Card title="Expériences professionnelles" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {form.experiences.map((exp, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl">
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.role}
                    onChange={(e) =>
                      updateExperience(i, "role", e.target.value)
                    }
                    placeholder="Poste"
                  />
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.company}
                    onChange={(e) =>
                      updateExperience(i, "company", e.target.value)
                    }
                    placeholder="Entreprise"
                  />
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.period}
                    onChange={(e) =>
                      updateExperience(i, "period", e.target.value)
                    }
                    placeholder="Période"
                  />
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={exp.description.join("\n")}
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

        <div className="flex justify-between">
          <button onClick={onBack} className="px-6 py-3 border rounded-xl">
            ← Retour
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl"
          >
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   CARD
======================= */

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-6 ${className}`}>
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}
