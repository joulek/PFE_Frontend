"use client";
import { useMemo, useState } from "react";

/* =======================
   HELPERS
======================= */
function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function uniqCleanSkills(skills) {
  const seen = new Set();
  return safeArr(skills)
    .map((s) => safeStr(s))
    .filter((s) => s.length > 0)
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/* =======================
   COMPONENT
======================= */
export default function StepManual({ parsedCV, cvFileUrl, onBack, onSubmit }) {
  /**
   * parsedCV هنا لازم يكون response.result
   * مثال:
   * <StepManual parsedCV={response.result} ... />
   */

  const initial = useMemo(() => {
    const p = parsedCV || {};

    const fixedEmail = safeStr(p.email)
      .replace("envel⌢pe", "")
      .replace("/envel⌢pe", "")
      .replace("envelpe", "")
      .trim();

    return {
      personal_info: {
        full_name: safeStr(p.nom),
        email: fixedEmail,
        phone: safeStr(p.telephone),
        address: safeStr(p.adresse),
        job_title: safeStr(p.titre_poste),
        linkedin: safeStr(p?.reseaux_sociaux?.linkedin),
        github: safeStr(p?.reseaux_sociaux?.github),
      },

      profile: safeStr(p.profil),

      skills: uniqCleanSkills([
        ...safeArr(p?.competences?.langages_programmation),
        ...safeArr(p?.competences?.frameworks),
        ...safeArr(p?.competences?.outils),
        ...safeArr(p?.competences?.bases_donnees),
        ...safeArr(p?.competences?.autres),
      ]),

      education: safeArr(p.formation).map((edu) => ({
        degree: safeStr(edu?.diplome),
        institution: safeStr(edu?.etablissement),
        period: safeStr(edu?.periode),
      })),

      experience: safeArr(p.experience_professionnelle).map((exp) => ({
        role: safeStr(exp?.poste),
        company: safeStr(exp?.entreprise),
        period: safeStr(exp?.periode),
        location: safeStr(exp?.lieu),
        description: safeStr(exp?.description),
      })),

      projects: safeArr(p.projets).map((pr) => ({
        name: safeStr(pr?.nom),
        description: safeStr(pr?.description),
        technologies: safeArr(pr?.technologies).map((t) => safeStr(t)),
      })),

      certifications: safeArr(p.certifications).map((c) => ({
        name: safeStr(c?.nom),
        org: safeStr(c?.organisme),
        date: safeStr(c?.date),
      })),

      languages: safeArr(p.langues).map((l) => ({
        name: safeStr(l?.langue),
        level: safeStr(l?.niveau),
      })),

      interests: safeArr(p.activites).map((x) => safeStr(x)),
    };
  }, [parsedCV]);

  const [form, setForm] = useState(initial);

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl " +
    "focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] outline-none transition bg-white";

  /* =======================
     EDUCATION
  ======================= */
  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", period: "" }],
    }));
  };

  const removeEducation = (i) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== i),
    }));
  };

  const updateEducation = (i, field, value) => {
    setForm((prev) => {
      const arr = [...prev.education];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, education: arr };
    });
  };

  /* =======================
     EXPERIENCE
  ======================= */
  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: "", company: "", period: "", location: "", description: "" },
      ],
    }));
  };

  const removeExperience = (i) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, idx) => idx !== i),
    }));
  };

  const updateExperience = (i, field, value) => {
    setForm((prev) => {
      const arr = [...prev.experience];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, experience: arr };
    });
  };

  /* =======================
     PROJECTS
  ======================= */
  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: "", description: "", technologies: [] }],
    }));
  };

  const removeProject = (i) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== i),
    }));
  };

  const updateProject = (i, field, value) => {
    setForm((prev) => {
      const arr = [...prev.projects];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, projects: arr };
    });
  };

  /* =======================
     SKILLS
  ======================= */
  const removeSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addSkill = (skill) => {
    const s = safeStr(skill);
    if (!s) return;
    setForm((prev) => ({
      ...prev,
      skills: uniqCleanSkills([...prev.skills, s]),
    }));
  };

  /* =======================
     CERTIFICATIONS
  ======================= */
  const addCertification = () => {
    setForm((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", org: "", date: "" }],
    }));
  };

  const removeCertification = (i) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== i),
    }));
  };

  const updateCertification = (i, field, value) => {
    setForm((prev) => {
      const arr = [...prev.certifications];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, certifications: arr };
    });
  };

  /* =======================
     LANGUAGES
  ======================= */
  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [...prev.languages, { name: "", level: "" }],
    }));
  };

  const removeLanguage = (i) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, idx) => idx !== i),
    }));
  };

  const updateLanguage = (i, field, value) => {
    setForm((prev) => {
      const arr = [...prev.languages];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, languages: arr };
    });
  };

  /* =======================
     SUBMIT
  ======================= */
  function handleSubmit() {
    const payload = {
      nom: safeStr(form.personal_info.full_name),
      email: safeStr(form.personal_info.email),
      telephone: safeStr(form.personal_info.phone),
      adresse: safeStr(form.personal_info.address),
      titre_poste: safeStr(form.personal_info.job_title),
      profil: safeStr(form.profile),

      reseaux_sociaux: {
        linkedin: safeStr(form.personal_info.linkedin),
        github: safeStr(form.personal_info.github),
      },

      formation: form.education.map((e) => ({
        diplome: safeStr(e.degree),
        etablissement: safeStr(e.institution),
        periode: safeStr(e.period),
      })),

      experience_professionnelle: form.experience.map((e) => ({
        poste: safeStr(e.role),
        entreprise: safeStr(e.company),
        lieu: safeStr(e.location),
        periode: safeStr(e.period),
        description: safeStr(e.description),
      })),

      competences: {
        all: form.skills, // نخليهم array واحدة واضحة
      },

      projets: form.projects.map((p) => ({
        nom: safeStr(p.name),
        description: safeStr(p.description),
        technologies: safeArr(p.technologies),
      })),

      certifications: form.certifications.map((c) => ({
        nom: safeStr(c.name),
        organisme: safeStr(c.org),
        date: safeStr(c.date),
      })),

      langues: form.languages.map((l) => ({
        langue: safeStr(l.name),
        niveau: safeStr(l.level),
      })),

      activites: safeArr(form.interests),
    };

    onSubmit(payload);
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <h2 className="text-3xl font-bold">Étape 2 — Vérification & Complément</h2>

        {cvFileUrl && (
          <a
            href={`http://localhost:5000${cvFileUrl}`}
            target="_blank"
            className="text-green-700 underline"
          >
            Voir le CV
          </a>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PERSONAL */}
          <Card title="Informations personnelles">
            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.full_name}
              placeholder="Nom complet"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, full_name: e.target.value },
                }))
              }
            />

            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.email}
              placeholder="Email"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, email: e.target.value },
                }))
              }
            />

            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.phone}
              placeholder="Téléphone"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, phone: e.target.value },
                }))
              }
            />

            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.address}
              placeholder="Adresse"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, address: e.target.value },
                }))
              }
            />

            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.job_title}
              placeholder="Titre du poste"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, job_title: e.target.value },
                }))
              }
            />

            <input
              className={`${inputClass} mb-3`}
              value={form.personal_info.linkedin}
              placeholder="LinkedIn"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, linkedin: e.target.value },
                }))
              }
            />

            <input
              className={inputClass}
              value={form.personal_info.github}
              placeholder="GitHub"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, github: e.target.value },
                }))
              }
            />
          </Card>

          {/* PROFILE */}
          <Card title="Profil / Résumé">
            <textarea
              rows={8}
              className={inputClass}
              value={form.profile}
              onChange={(e) => setForm((prev) => ({ ...prev, profile: e.target.value }))}
              placeholder="Résumé du profil..."
            />
          </Card>

          {/* EDUCATION */}
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
            {form.education.length === 0 ? (
              <p className="text-gray-500">Aucune formation détectée.</p>
            ) : (
              form.education.map((edu, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl mb-4 relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(i)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                  >
                    ×
                  </button>

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
              ))
            )}
          </Card>

          {/* SKILLS */}
          <Card title="Compétences (Skills)">
            <AddSkillBox onAdd={addSkill} />
            <div className="flex flex-wrap gap-2 mt-4">
              {form.skills.map((s, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => removeSkill(s)}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200"
                  title="Clique pour supprimer"
                >
                  {s} ✕
                </button>
              ))}
            </div>
          </Card>

          {/* EXPERIENCE */}
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Expériences professionnelles</span>
                <button
                  type="button"
                  onClick={addExperience}
                  className="text-green-600 hover:text-green-800 text-xl font-bold"
                >
                  ＋
                </button>
              </div>
            }
            className="md:col-span-2"
          >
            {form.experience.length === 0 ? (
              <p className="text-gray-500">Aucune expérience détectée.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.experience.map((exp, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeExperience(i)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                    >
                      ×
                    </button>

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
                      value={exp.location}
                      onChange={(e) => updateExperience(i, "location", e.target.value)}
                      placeholder="Lieu"
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
                      value={exp.description}
                      onChange={(e) => updateExperience(i, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* PROJECTS */}
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Projets</span>
                <button
                  type="button"
                  onClick={addProject}
                  className="text-green-600 hover:text-green-800 text-xl font-bold"
                >
                  ＋
                </button>
              </div>
            }
            className="md:col-span-2"
          >
            {form.projects.length === 0 ? (
              <p className="text-gray-500">Aucun projet détecté.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.projects.map((p, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeProject(i)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                    >
                      ×
                    </button>

                    <input
                      className={`${inputClass} mb-2`}
                      value={p.name}
                      onChange={(e) => updateProject(i, "name", e.target.value)}
                      placeholder="Titre du projet"
                    />

                    <textarea
                      rows={4}
                      className={`${inputClass} mb-2`}
                      value={p.description}
                      onChange={(e) => updateProject(i, "description", e.target.value)}
                      placeholder="Description"
                    />

                    <input
                      className={inputClass}
                      value={safeArr(p.technologies).join(", ")}
                      onChange={(e) =>
                        updateProject(
                          i,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Technologies (séparées par ,)"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* CERTIFICATIONS */}
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Certifications</span>
                <button
                  type="button"
                  onClick={addCertification}
                  className="text-green-600 hover:text-green-800 text-xl font-bold"
                >
                  ＋
                </button>
              </div>
            }
          >
            {form.certifications.length === 0 ? (
              <p className="text-gray-500">Aucune certification.</p>
            ) : (
              form.certifications.map((c, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl mb-4 relative">
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                  >
                    ×
                  </button>

                  <input
                    className={`${inputClass} mb-2`}
                    value={c.name}
                    onChange={(e) => updateCertification(i, "name", e.target.value)}
                    placeholder="Nom"
                  />
                  <input
                    className={`${inputClass} mb-2`}
                    value={c.org}
                    onChange={(e) => updateCertification(i, "org", e.target.value)}
                    placeholder="Organisme"
                  />
                  <input
                    className={inputClass}
                    value={c.date}
                    onChange={(e) => updateCertification(i, "date", e.target.value)}
                    placeholder="Date"
                  />
                </div>
              ))
            )}
          </Card>

          {/* LANGUAGES */}
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Langues</span>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="text-green-600 hover:text-green-800 text-xl font-bold"
                >
                  ＋
                </button>
              </div>
            }
          >
            {form.languages.length === 0 ? (
              <p className="text-gray-500">Aucune langue.</p>
            ) : (
              form.languages.map((l, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl mb-4 relative">
                  <button
                    type="button"
                    onClick={() => removeLanguage(i)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                  >
                    ×
                  </button>

                  <input
                    className={`${inputClass} mb-2`}
                    value={l.name}
                    onChange={(e) => updateLanguage(i, "name", e.target.value)}
                    placeholder="Langue"
                  />
                  <input
                    className={inputClass}
                    value={l.level}
                    onChange={(e) => updateLanguage(i, "level", e.target.value)}
                    placeholder="Niveau"
                  />
                </div>
              ))
            )}
          </Card>
        </div>

        <div className="flex justify-between">
          <button onClick={onBack} className="px-6 py-3 border rounded-xl">
            ← Retour
          </button>
          <button
            onClick={handleSubmit}
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
   SMALL COMPONENTS
======================= */
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-6 ${className}`}>
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}

function AddSkillBox({ onAdd }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] outline-none transition bg-white"
        placeholder="Ajouter une compétence (ex: React)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="button"
        className="px-4 py-3 bg-green-600 text-white rounded-xl"
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
      >
        Ajouter
      </button>
    </div>
  );
}
