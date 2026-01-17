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

        // ✅ NOUVEAUX CHAMPS
        date_naissance: safeStr(p?.personal_info?.date_naissance),
        lieu_naissance: safeStr(p?.personal_info?.lieu_naissance),
        numero_cin: safeStr(p?.personal_info?.numero_cin),
        cin_delivree_le: safeStr(p?.personal_info?.cin_delivree_le),
        cin_delivree_a: safeStr(p?.personal_info?.cin_delivree_a),
        code_postal: safeStr(p?.personal_info?.code_postal),
        permis_conduire: safeStr(p?.personal_info?.permis_conduire),
        date_obtention_permis: safeStr(p?.personal_info?.date_obtention_permis),
        situation_familiale: safeStr(p?.personal_info?.situation_familiale),
        nombre_enfants: safeStr(p?.personal_info?.nombre_enfants),
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
  const [sectionIndex, setSectionIndex] = useState(0);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

      personal_info: {
        date_naissance: safeStr(form.personal_info.date_naissance),
        lieu_naissance: safeStr(form.personal_info.lieu_naissance),
        numero_cin: safeStr(form.personal_info.numero_cin),
        cin_delivree_le: safeStr(form.personal_info.cin_delivree_le),
        cin_delivree_a: safeStr(form.personal_info.cin_delivree_a),
        code_postal: safeStr(form.personal_info.code_postal),
        permis_conduire: safeStr(form.personal_info.permis_conduire),
        date_obtention_permis: safeStr(form.personal_info.date_obtention_permis),
        situation_familiale: safeStr(form.personal_info.situation_familiale),
        nombre_enfants: safeStr(form.personal_info.nombre_enfants),
      },

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

      competences: { all: form.skills },

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
      setErrorMsg(
        "❌ " + (e?.message || "Erreur lors de l’envoi. Essayez à nouveau.")
      );
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
            dataCy="full-name"
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
              dataCy="email"
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
              dataCy="phone"
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
            dataCy="address"
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, address: v },
              }))
            }
          />

          {/* ✅ NOUVEAUX CHAMPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Date de naissance"
              placeholder="JJ/MM/AAAA"
              value={form.personal_info.date_naissance}
              dataCy="date-naissance"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, date_naissance: v },
                }))
              }
            />

            <InputField
              label="Lieu de naissance"
              placeholder="Ex : Tunis"
              value={form.personal_info.lieu_naissance}
              dataCy="lieu-naissance"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, lieu_naissance: v },
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Numéro CIN"
              placeholder="Ex : 12345678"
              value={form.personal_info.numero_cin}
              dataCy="numero-cin"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, numero_cin: v },
                }))
              }
            />

            <InputField
              label="Délivrée le"
              placeholder="JJ/MM/AAAA"
              value={form.personal_info.cin_delivree_le}
              dataCy="cin-delivree-le"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, cin_delivree_le: v },
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Délivrée à"
              placeholder="Ex : Sfax"
              value={form.personal_info.cin_delivree_a}
              dataCy="cin-delivree-a"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, cin_delivree_a: v },
                }))
              }
            />

            <InputField
              label="Code postal"
              placeholder="Ex : 3000"
              value={form.personal_info.code_postal}
              dataCy="code-postal"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, code_postal: v },
                }))
              }
            />
          </div>

          {/* PERMIS */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Permis de conduire
            </p>

            <div className="flex gap-3">
              <button
                data-cy="permis-oui"
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    personal_info: {
                      ...prev.personal_info,
                      permis_conduire: "Oui",
                    },
                  }))
                }
                className={`px-6 py-3 rounded-full border font-semibold transition
                ${
                  safeStr(form.personal_info.permis_conduire).toLowerCase() ===
                  "oui"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Oui
              </button>

              <button
                data-cy="permis-non"
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    personal_info: {
                      ...prev.personal_info,
                      permis_conduire: "Non",
                      date_obtention_permis: "",
                    },
                  }))
                }
                className={`px-6 py-3 rounded-full border font-semibold transition
                ${
                  safeStr(form.personal_info.permis_conduire).toLowerCase() ===
                  "non"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Non
              </button>
            </div>
          </div>

          {/* Date permis (seulement si Oui) */}
          {safeStr(form.personal_info.permis_conduire).toLowerCase() === "oui" && (
            <InputField
              label="Date d’obtention du permis"
              placeholder="JJ/MM/AAAA"
              value={form.personal_info.date_obtention_permis}
              dataCy="date-obtention-permis"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    date_obtention_permis: v,
                  },
                }))
              }
            />
          )}

          {/* Situation familiale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                Situation familiale
              </p>

              <select
                data-cy="situation-familiale"
                className="w-full px-6 py-4 border border-gray-200 rounded-full bg-white
                           focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                value={form.personal_info.situation_familiale}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    personal_info: {
                      ...prev.personal_info,
                      situation_familiale: e.target.value,
                    },
                  }))
                }
              >
                <option value="">-- Choisir --</option>
                <option value="Célibataire">Célibataire</option>
                <option value="Marié(e)">Marié(e)</option>
                <option value="Divorcé(e)">Divorcé(e)</option>
                <option value="Veuf(ve)">Veuf(ve)</option>
              </select>
            </div>

            {safeStr(form.personal_info.situation_familiale).toLowerCase() ===
              "marié(e)".toLowerCase() && (
              <InputField
                label="Nombre d’enfants"
                placeholder="Ex : 2"
                value={form.personal_info.nombre_enfants}
                dataCy="nombre-enfants"
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, nombre_enfants: v },
                  }))
                }
              />
            )}
          </div>

          <InputField
            label="Poste actuel"
            placeholder="Ex : Développeur Fullstack Senior"
            value={form.personal_info.job_title}
            dataCy="job-title"
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

    // باقي الأقسام كما عندك (profile, education, skills, experience...)
    // ⬇️ خليهم كما هما عندك بدون تغيير
    ...getOtherSections({
      form,
      setForm,
      newInterest,
      setNewInterest,
      addEducation,
      removeEducation,
      updateEducation,
      addExperience,
      removeExperience,
      updateExperience,
      addProject,
      removeProject,
      updateProject,
      addSkill,
      removeSkill,
      addCertification,
      removeCertification,
      updateCertification,
      addLanguage,
      removeLanguage,
      updateLanguage,
    }),
  ];

  const total = sections.length;
  const current = sectionIndex + 1;
  const percent = Math.round((current / total) * 100);
  const isLast = sectionIndex === sections.length - 1;

  const currentSection = sections[sectionIndex];

  return (
    <div className="min-h-screen bg-green-50 py-14">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.25em] text-gray-500 font-semibold">
            SECTION {current} / {total}
          </p>

          <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
            Étape 2 — Vérification & Complément
          </h2>
        </div>

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

        <Card title={currentSection.title} rightAction={null}>
          {currentSection.render()}
        </Card>

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

function InputField({ label, value, onChange, placeholder, dataCy }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <input
        data-cy={dataCy}
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

function getOtherSections() {
  return [];
}
