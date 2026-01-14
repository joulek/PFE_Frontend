"use client";
import { useState } from "react";

/* =======================
   SAFE UTILITIES
======================= */

function extractPeriod(p) {
  if (!p) return "";
  if (Array.isArray(p)) return p.join(" - ");
  if (typeof p !== "string") return "";
  return p;
}

function extractSchool(text = "") {
  if (!text) return "";
  const t = text.toLowerCase();
  if (t.includes("iset")) return "ISET Sfax";
  if (t.includes("sfax")) return "Université de Sfax";
  if (t.includes("univers")) return text;
  return "";
}

function extractDegree(text = "") {
  if (!text) return "";
  return text
    .replace(/(septembre|janvier|février|mars|avril|mai|juin|juillet|août|octobre|novembre|décembre).*/gi, "")
    .trim();
}

function extractRole(text = "") {
  if (!text) return "Développeuse";
  const t = text.toLowerCase();
  if (t.includes("freelance")) return "Développeuse Full Stack";
  if (t.includes("stage")) return "Stagiaire Développeuse Web";
  if (t.includes("backend")) return "Développeuse Backend";
  if (t.includes("frontend")) return "Développeuse Frontend";
  if (t.includes("full")) return "Développeuse Full Stack";
  return "Développeuse";
}

function extractBullets(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text;
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•▪o]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

function cleanCompany(c = "") {
  if (!c) return "";
  return c.replace(/ACTIVITÉS|ACTIVITES/gi, "").replace(/\n/g, "").trim();
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
      period: extractPeriod(e.period),
    })),

    skills: (parsedCV?.skills || []).filter(
      (s) =>
        typeof s === "string" &&
        s.length < 40 &&
        !s.toLowerCase().includes("cursus") &&
        !s.toLowerCase().includes("master") &&
        !s.toLowerCase().includes("licence")
    ),

    experiences: (parsedCV?.work_experience || []).map((e) => {
      const desc = Array.isArray(e.description) ? e.description.join(" ") : e.description;
      return {
        role: extractRole(desc),
        company: cleanCompany(e.company || ""),
        period: extractPeriod(e.period),
        description: extractBullets(e.description),
      };
    }),
  }));

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl " +
    "focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] outline-none transition";

  /* =======================
     UPDATERS
  ====================== */

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

  const addEducation = () => {
    setForm({
      ...form,
      education: [...form.education, { degree: "", institution: "", period: "" }],
    });
  };

  /* =======================
     RENDER
  ====================== */

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

          {/* ========== PERSONAL ========= */}
          <Card title="Informations personnelles">
            {["fullName", "email", "phone", "linkedin", "github"].map((k) => (
              <input
                key={k}
                className={`${inputClass} mb-3`}
                value={form[k]}
                placeholder={k}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            ))}
          </Card>

          {/* ========== EDUCATION ========= */}
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Formation</span>
                <button
                  type="button"
                  onClick={addEducation}
                  className="text-green-600 hover:text-green-800 text-xl font-bold"
                >
                  ＋
                </button>
              </div>
            }
          >
            {form.education.map((edu, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-xl mb-4">
                <input
                  className={`${inputClass} mb-2`}
                  value={edu.degree}
                  onChange={(e) => updateEducation(i, "degree", e.target.value)}
                  placeholder="Diplôme"
                />
                <input
                  className={`${inputClass} mb-2`}
                  value={edu.institution}
                  onChange={(e) => updateEducation(i, "institution", e.target.value)}
                  placeholder="Établissement"
                />
                <input
                  className={inputClass}
                  value={edu.period}
                  onChange={(e) => updateEducation(i, "period", e.target.value)}
                  placeholder="Période"
                />
              </div>
            ))}
          </Card>

          {/* ========== SKILLS ========= */}
          <Card title="Compétences (Skills)">
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s, i) => (
                <span
                  key={i}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* ========== EXPERIENCE ========= */}
          <Card title="Expériences professionnelles" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {form.experiences.map((exp, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl">
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.role}
                    onChange={(e) => updateExperience(i, "role", e.target.value)}
                    placeholder="Poste"
                  />
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.company}
                    onChange={(e) => updateExperience(i, "company", e.target.value)}
                    placeholder="Entreprise"
                  />
                  <input
                    className={`${inputClass} mb-2`}
                    value={exp.period}
                    onChange={(e) => updateExperience(i, "period", e.target.value)}
                    placeholder="Période"
                  />
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={exp.description.join("\n")}
                    onChange={(e) =>
                      updateExperience(i, "description", e.target.value.split("\n"))
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
