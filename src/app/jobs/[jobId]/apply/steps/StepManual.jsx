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

      personal_info_extra: [],

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

  // section actuelle
  const [sectionIndex, setSectionIndex] = useState(0);

  // submit states
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // NEW: input temporaire pour ajouter une activité/intérêt
  const [newInterest, setNewInterest] = useState("");

  /* =======================
     CRUD FUNCTIONS
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
     SUBMIT FINAL
  ======================= */
  async function handleSubmitFinal() {
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

      personal_info_extra: safeArr(form.personal_info_extra).map((x) => ({
        label: safeStr(x.label),
        value: safeStr(x.value),
      })),

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
        all: form.skills,
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

    try {
      setLoadingSubmit(true);
      setSuccessMsg("");
      setErrorMsg("");

      await onSubmit(payload);

      setSuccessMsg("Votre candidature a été envoyée avec succès !");
    } catch (e) {
      setErrorMsg("❌ " + (e?.message || "Erreur lors de l’envoi. Essayez à nouveau."));
    } finally {
      setLoadingSubmit(false);
    }
  }

  /* =======================
     SECTIONS LIST
  ======================= */
  const sections = [
    {
      key: "personal",
      title: "Informations personnelles",
      addLabel: "Ajouter un champ",
      onAdd: () => {
        setForm((prev) => ({
          ...prev,
          personal_info_extra: [
            ...(prev.personal_info_extra || []),
            { label: "", value: "" },
          ],
        }));
      },
      render: () => (
        <div className="space-y-6">
          <InputField
            label="Nom complet"
            placeholder="Ex : Jean Dupont"
            value={form.personal_info.full_name}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, full_name: v },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              placeholder="jean.dupont@exemple.com"
              value={form.personal_info.email}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, email: v },
                }))
              }
            />

            <InputField
              label="Téléphone"
              placeholder="+33 6 00 00 00 00"
              value={form.personal_info.phone}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, phone: v },
                }))
              }
            />
          </div>

          <InputField
            label="Adresse de résidence"
            placeholder="123 Rue de la République, 75001 Paris"
            value={form.personal_info.address}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, address: v },
              }))
            }
          />

          <InputField
            label="Poste actuel"
            placeholder="Ex : Développeur Fullstack Senior"
            value={form.personal_info.job_title}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, job_title: v },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IconInputField
              label="LinkedIn (URL)"
              placeholder="linkedin.com/in/jeandupont"
              value={form.personal_info.linkedin}
              icon="in"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, linkedin: v },
                }))
              }
            />

            <IconInputField
              label="GitHub (URL)"
              placeholder="github.com/jeandupont"
              value={form.personal_info.github}
              icon="<>"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, github: v },
                }))
              }
            />
          </div>

          {safeArr(form.personal_info_extra).length > 0 && (
            <div className="space-y-3 pt-2">
              {safeArr(form.personal_info_extra).map((f, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={`Champ ${idx + 1} (titre)`}
                    placeholder="Ex : Nationalité"
                    value={safeStr(f.label)}
                    onChange={(v) =>
                      setForm((prev) => {
                        const extra = [...safeArr(prev.personal_info_extra)];
                        extra[idx] = { ...extra[idx], label: v };
                        return { ...prev, personal_info_extra: extra };
                      })
                    }
                  />
                  <InputField
                    label="Valeur"
                    placeholder="Ex : Tunisienne"
                    value={safeStr(f.value)}
                    onChange={(v) =>
                      setForm((prev) => {
                        const extra = [...safeArr(prev.personal_info_extra)];
                        extra[idx] = { ...extra[idx], value: v };
                        return { ...prev, personal_info_extra: extra };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    {
      key: "profile",
      title: "Profil / Résumé",
      render: () => (
        <textarea
          rows={8}
          className="w-full px-6 py-4 border border-gray-200 rounded-3xl bg-white
                     focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                     placeholder:text-gray-400"
          value={form.profile}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, profile: e.target.value }))
          }
          placeholder="Résumé du profil..."
        />
      ),
    },

    {
      key: "education",
      title: "Formation",
      addLabel: "Ajouter une formation",
      onAdd: addEducation,
      render: () =>
        form.education.length === 0 ? (
          <p className="text-gray-500">Aucune formation détectée.</p>
        ) : (
          <div className="space-y-6">
            {form.education.map((edu, i) => (
              <div
                key={i}
                className="bg-gray-50/70 border border-gray-100 rounded-[22px] p-6 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducation(i)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                  title="Supprimer"
                >
                  ×
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MiniField
                    label="DIPLÔME"
                    value={edu.degree}
                    placeholder="Master en Intelligence Artificielle"
                    onChange={(v) => updateEducation(i, "degree", v)}
                  />
                  <MiniField
                    label="ÉTABLISSEMENT"
                    value={edu.institution}
                    placeholder="Université Paris-Sorbonne"
                    onChange={(v) => updateEducation(i, "institution", v)}
                  />
                  <MiniField
                    label="PÉRIODE"
                    value={edu.period}
                    placeholder="2020 - 2022"
                    onChange={(v) => updateEducation(i, "period", v)}
                  />
                </div>
              </div>
            ))}
          </div>
        ),
    },

    {
      key: "skills",
      title: "Compétences (Skills)",
      render: () => (
        <>
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
        </>
      ),
    },

    {
      key: "experience",
      title: "Expériences professionnelles",
      addLabel: "Ajouter une expérience",
      onAdd: addExperience,
      render: () =>
        form.experience.length === 0 ? (
          <p className="text-gray-500">Aucune expérience détectée.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {form.experience.map((exp, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-2xl relative">
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
                >
                  ×
                </button>

                <div className="space-y-3">
                  <InputField
                    label="Poste"
                    placeholder="Ex : Développeur"
                    value={exp.role}
                    onChange={(v) => updateExperience(i, "role", v)}
                  />
                  <InputField
                    label="Entreprise"
                    placeholder="Ex : OpenAI"
                    value={exp.company}
                    onChange={(v) => updateExperience(i, "company", v)}
                  />
                  <InputField
                    label="Lieu"
                    placeholder="Ex : Sfax"
                    value={exp.location}
                    onChange={(v) => updateExperience(i, "location", v)}
                  />
                  <InputField
                    label="Période"
                    placeholder="Ex : 2024 - 2025"
                    value={exp.period}
                    onChange={(v) => updateExperience(i, "period", v)}
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Description
                    </p>
                    <textarea
                      rows={4}
                      className="w-full px-6 py-4 border border-gray-200 rounded-3xl bg-white
                                 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                                 placeholder:text-gray-400"
                      value={exp.description}
                      onChange={(e) =>
                        updateExperience(i, "description", e.target.value)
                      }
                      placeholder="Décrivez votre expérience..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
    },

    {
      key: "projects",
      title: "Projets",
      addLabel: "Ajouter un projet",
      onAdd: addProject,
      render: () =>
        form.projects.length === 0 ? (
          <p className="text-gray-500">Aucun projet détecté.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {form.projects.map((p, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-2xl relative">
                <button
                  type="button"
                  onClick={() => removeProject(i)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
                >
                  ×
                </button>

                <div className="space-y-3">
                  <InputField
                    label="Titre du projet"
                    placeholder="Ex : YnityLearn"
                    value={p.name}
                    onChange={(v) => updateProject(i, "name", v)}
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Description
                    </p>
                    <textarea
                      rows={4}
                      className="w-full px-6 py-4 border border-gray-200 rounded-3xl bg-white
                                 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                                 placeholder:text-gray-400"
                      value={p.description}
                      onChange={(e) =>
                        updateProject(i, "description", e.target.value)
                      }
                      placeholder="Décrivez le projet..."
                    />
                  </div>

                  <InputField
                    label="Technologies"
                    placeholder="React, Node, MongoDB..."
                    value={safeArr(p.technologies).join(", ")}
                    onChange={(v) =>
                      updateProject(
                        i,
                        "technologies",
                        v
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ),
    },

    {
      key: "certifications",
      title: "Certifications",
      addLabel: "Ajouter une certification",
      onAdd: addCertification,
      render: () =>
        form.certifications.length === 0 ? (
          <p className="text-gray-500">Aucune certification.</p>
        ) : (
          form.certifications.map((c, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-2xl mb-4 relative">
              <button
                type="button"
                onClick={() => removeCertification(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
              >
                ×
              </button>

              <div className="space-y-3">
                <InputField
                  label="Nom"
                  placeholder="Ex : ISTQB Foundation"
                  value={c.name}
                  onChange={(v) => updateCertification(i, "name", v)}
                />
                <InputField
                  label="Organisme"
                  placeholder="Ex : ISTQB"
                  value={c.org}
                  onChange={(v) => updateCertification(i, "org", v)}
                />
                <InputField
                  label="Date"
                  placeholder="Ex : 2025"
                  value={c.date}
                  onChange={(v) => updateCertification(i, "date", v)}
                />
              </div>
            </div>
          ))
        ),
    },

    {
      key: "languages",
      title: "Langues",
      addLabel: "Ajouter une langue",
      onAdd: addLanguage,
      render: () =>
        form.languages.length === 0 ? (
          <p className="text-gray-500">Aucune langue.</p>
        ) : (
          form.languages.map((l, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-2xl mb-4 relative">
              <button
                type="button"
                onClick={() => removeLanguage(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
              >
                ×
              </button>

              <div className="space-y-3">
                <InputField
                  label="Langue"
                  placeholder="Ex : Français"
                  value={l.name}
                  onChange={(v) => updateLanguage(i, "name", v)}
                />
                <InputField
                  label="Niveau"
                  placeholder="Ex : B2"
                  value={l.level}
                  onChange={(v) => updateLanguage(i, "level", v)}
                />
              </div>
            </div>
          ))
        ),
    },

    // ✅ INTERESTS with add button
    {
      key: "interests",
      title: "Activités / Intérêts",
      addLabel: "Ajouter un champ",
      onAdd: () => {
        const v = safeStr(newInterest);
        if (!v) return;

        setForm((prev) => ({
          ...prev,
          interests: [...safeArr(prev.interests), v],
        }));

        setNewInterest("");
      },
      render: () => (
        <div className="space-y-4">
          <input
            className="w-full px-6 py-4 border border-gray-200 rounded-full bg-white
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                       placeholder:text-gray-400"
            placeholder="Ajouter une activité (ex: Sport, Club, YouTube...)"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
          />

          {form.interests.length === 0 ? (
            <p className="text-gray-500">Aucun centre d’intérêt.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {form.interests.map((x, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      interests: prev.interests.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition"
                  title="Clique pour supprimer"
                >
                  {x} ✕
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  const total = sections.length;
  const current = sectionIndex + 1;
  const percent = Math.round((current / total) * 100);
  const isLast = sectionIndex === sections.length - 1;

  const currentSection = sections[sectionIndex];

  return (
    <div className="min-h-screen bg-green-50 py-14">
      <div className="max-w-5xl mx-auto px-6">
        {/* ===== TOP HEADER ===== */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.25em] text-gray-500 font-semibold">
            SECTION {current} / {total}
          </p>

          <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
            Étape 2 — Vérification & Complément
          </h2>
        </div>

        {/* ===== PROGRESS ===== */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression de la candidature</span>
            <span className="font-semibold text-green-700">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* ===== MAIN CARD ===== */}
        <Card
          title={currentSection.title}
          rightAction={
            currentSection.onAdd ? (
              <PillAddButton
                label={currentSection.addLabel || "Ajouter"}
                onClick={currentSection.onAdd}
              />
            ) : null
          }
        >
          {currentSection.render()}
        </Card>

        {/* ===== SUCCESS / ERROR ===== */}
        {successMsg && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center">
            {errorMsg}
          </div>
        )}

        {/* ===== BUTTONS ===== */}
        {!successMsg && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => {
                if (sectionIndex === 0) onBack?.();
                else setSectionIndex((p) => Math.max(0, p - 1));
              }}
              className="px-10 py-4 rounded-full border border-gray-900 bg-white
                         font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              ← Retour
            </button>

            {!isLast ? (
              <button
                onClick={() =>
                  setSectionIndex((p) => Math.min(sections.length - 1, p + 1))
                }
                className="px-10 py-4 rounded-full bg-green-600 text-white font-semibold
                           hover:bg-green-700 transition shadow-lg"
              >
                Continuer →
              </button>
            ) : (
              <button
                onClick={handleSubmitFinal}
                disabled={loadingSubmit}
                className="px-10 py-4 rounded-full bg-green-600 text-white font-semibold
                           hover:bg-green-700 transition shadow-lg disabled:opacity-50"
              >
                {loadingSubmit ? "Envoi..." : "Envoyer ma candidature →"}
              </button>
            )}
          </div>
        )}

        {!successMsg && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Vos modifications sont enregistrées automatiquement.
          </p>
        )}
      </div>
    </div>
  );
}

/* =======================
   SMALL COMPONENTS
======================= */
function Card({ title, rightAction, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-[28px] shadow-sm border border-green-100 p-8 ${className}`}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="font-bold text-2xl text-gray-900">{title}</h3>
        {rightAction}
      </div>

      {children}
    </div>
  );
}

function PillAddButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition"
    >
      <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
        +
      </span>
      {label}
    </button>
  );
}

function AddSkillBox({ onAdd }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 px-6 py-4 border border-gray-200 rounded-full bg-white
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                   placeholder:text-gray-400"
        placeholder="Ajouter une compétence (ex: React)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="button"
        className="px-6 py-4 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow"
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

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <input
        className="w-full px-6 py-4 border border-gray-200 rounded-full bg-white
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                   placeholder:text-gray-400"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function IconInputField({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>

      <div
        className="flex items-center border border-gray-200 rounded-full bg-white overflow-hidden
                   focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition"
      >
        <div className="w-14 h-14 flex items-center justify-center border-r border-gray-200 text-gray-500">
          <span className="text-sm font-bold">{icon}</span>
        </div>

        <input
          className="flex-1 px-5 py-4 outline-none bg-transparent placeholder:text-gray-400"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function MiniField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] tracking-[0.18em] font-bold text-gray-400 uppercase">
        {label}
      </p>

      <input
        className="w-full px-6 py-4 border border-gray-200 rounded-full bg-white
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition
                   placeholder:text-gray-400 text-gray-900 font-medium"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
