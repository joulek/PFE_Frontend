"use client";

import { useEffect, useState } from "react";
import { getMyCandidatures } from "../../services/candidature.api";

export default function CandidaturesPage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(u);

      try {
        const res = await getMyCandidatures();
        console.log("📊 Candidatures reçues:", res.data);
        setCandidatures(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("❌ Erreur chargement candidatures:", error);
        setCandidatures([]);
      }

      setLoading(false);
    }

    load();
  }, []);

  // ✅ IMPROVED: Deep extraction with multiple fallback paths
  const extractField = (c, field) => {
    // Try direct field
    if (c[field]) return c[field];
    
    // Try in extracted (direct)
    if (c.extracted?.[field]) return c.extracted[field];
    
    // ✅ Try in extracted.parsed (NEW - our extraction format)
    if (c.extracted?.parsed?.[field]) return c.extracted.parsed[field];
    
    // Try in extracted.personal_info
    if (c.extracted?.personal_info?.[field]) return c.extracted.personal_info[field];
    
    // Try in extracted.parsed.personal_info
    if (c.extracted?.parsed?.personal_info?.[field]) return c.extracted.parsed.personal_info[field];
    
    // Try in extracted.extracted (double nesting)
    if (c.extracted?.extracted?.[field]) return c.extracted.extracted[field];
    
    // Try in personalInfoForm
    if (c.personalInfoForm?.[field]) return c.personalInfoForm[field];
    
    return null;
  };

  const getName = (c) => {
    console.log("🔍 Extracting name for:", c._id);
    
    // Try fullName/nom from various sources
    let fullName = extractField(c, 'nom') 
      || extractField(c, 'fullName') 
      || extractField(c, 'full_name')
      || extractField(c, 'name');
    
    if (fullName) {
      console.log("✅ Found fullName:", fullName);
      return fullName;
    }
    
    // Try to build from prenom + nom
    const prenom = extractField(c, 'prenom') 
      || extractField(c, 'firstName') 
      || extractField(c, 'first_name');
    
    const nom = extractField(c, 'nom') 
      || extractField(c, 'lastName') 
      || extractField(c, 'last_name');
    
    if (prenom && nom) {
      const combined = `${prenom} ${nom}`;
      console.log("✅ Built name from prenom + nom:", combined);
      return combined;
    }
    
    if (prenom) {
      console.log("✅ Found only prenom:", prenom);
      return prenom;
    }
    
    if (nom) {
      console.log("✅ Found only nom:", nom);
      return nom;
    }
    
    console.warn("⚠️ No name found, checking raw structure:", {
      extracted: c.extracted,
      personalInfoForm: c.personalInfoForm
    });
    
    return "—";
  };

  const getEmail = (c) => {
    const email = extractField(c, 'email');
    console.log("📧 Email for", c._id, ":", email);
    return email || "—";
  };

  const getPhone = (c) => {
    const phone = extractField(c, 'telephone') 
      || extractField(c, 'phone')
      || extractField(c, 'tel');
    console.log("📞 Phone for", c._id, ":", phone);
    return phone || "—";
  };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const withApiPrefix = (url) => {
  if (!url) return null;
  // déjà absolue
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // relative -> on préfixe vers le backend
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return `${API_URL}/${url}`;
};

const getCvLink = (c) => {
  if (c.cv?.fileUrl) return withApiPrefix(c.cv.fileUrl);
  if (c.cv?.filename) return `${API_URL}/uploads/cvs/${c.cv.filename}`;
  if (c.cv?.path) return withApiPrefix(c.cv.path);
  return null;
};


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes candidatures</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rôle: {user?.role || "—"}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {candidatures.length} candidature{candidatures.length !== 1 ? "s" : ""} trouvée{candidatures.length !== 1 ? "s" : ""}
        </p>
      </div>

      {candidatures.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune candidature</h3>
          <p className="mt-2 text-sm text-gray-500">
            Les candidatures pour vos offres assignées apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidatures.map((c) => {
            const name = getName(c);
            const email = getEmail(c);
            const phone = getPhone(c);
            const cvLink = getCvLink(c);

            return (
              <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Offre:</span>{" "}
                      {c.jobTitle || c.jobOfferId || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {c._id}
                    </p>
                  </div>
                  
                  {/* Debug button */}
                  <button
                    onClick={() => {
                      console.log("🔍 Full candidature data:", c);
                      console.log("📦 extracted:", c.extracted);
                      console.log("📝 extracted.parsed:", c.extracted?.parsed);
                      console.log("👤 personalInfoForm:", c.personalInfoForm);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded"
                  >
                    Debug
                  </button>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      {email !== "—" ? (
                        <a href={`mailto:${email}`} className="text-sm text-[#4E8F2F] hover:underline truncate block">
                          {email}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Non renseigné</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Téléphone</p>
                      {phone !== "—" ? (
                        <a href={`tel:${phone}`} className="text-sm text-gray-900 hover:text-[#4E8F2F] truncate block">
                          {phone}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Non renseigné</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  {cvLink && (
                    <a
                      href={cvLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-[#4E8F2F] text-sm font-medium rounded-lg text-[#4E8F2F] hover:bg-[#4E8F2F] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Voir CV
                    </a>
                  )}

                  {c.linkedin && (
                    <a
                      href={c.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}

                  {c.fiche?.status && (
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-sm font-medium rounded-lg text-gray-700">
                      Fiche: {c.fiche.status}
                      {typeof c.fiche.answersCount === "number" && ` (${c.fiche.answersCount})`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}