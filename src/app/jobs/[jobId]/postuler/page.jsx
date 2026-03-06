"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Send, ArrowLeft, Upload, X, CheckCircle2, GraduationCap } from "lucide-react";
import { getJobById } from "../../../services/job.api";
import { applyToStage } from "../../../services/application.api";

export default function StagePostulerPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId;

  const [job, setJob] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cvFile, setCvFile] = useState(null);

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    posteRecherche: "",
    message: "",
  });

  useEffect(() => {
    if (!jobId) return;
    getJobById(jobId)
      .then((res) => {
        const jobData = res?.data || res;
        setJob(jobData);
        setForm((prev) => ({ ...prev, posteRecherche: jobData?.titre || "" }));
      })
      .catch(() => {});
  }, [jobId]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("❌ Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setCvFile(file);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.prenom.trim() || !form.nom.trim()) {
      setError("❌ Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setError("❌ Email invalide.");
      return;
    }
    if (!form.message.trim()) {
      setError("❌ La lettre de motivation est obligatoire.");
      return;
    }

    const formData = new FormData();
    formData.append("prenom", form.prenom.trim());
    formData.append("nom", form.nom.trim());
    formData.append("email", form.email.trim());
    formData.append("telephone", form.telephone.trim());
    formData.append("posteRecherche", form.posteRecherche.trim());
    formData.append("message", form.message.trim());
    if (cvFile) formData.append("cv", cvFile);

    try {
      setLoading(true);
      // ✅ Route dédiée pour postuler à un stage
      await applyToStage(jobId, formData);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full h-12 px-5 rounded-full border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:border-blue-500 dark:focus:border-blue-400 " +
    "focus:ring-4 focus:ring-blue-500/15 outline-none transition-colors";

  const labelBase =
    "block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-950/40 grid place-items-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Candidature envoyée !
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Merci pour votre intérêt. Notre équipe RH examinera votre dossier et vous contactera prochainement.
          </p>
          <button
            onClick={() => router.push("/jobs")}
            className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-2xl mx-auto px-6 py-12">
    

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 grid place-items-center">
              <GraduationCap size={20} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Postuler pour ce stage
              </h1>
              {job?.titre ? (
                <p className="text-sm text-blue-500 font-semibold mt-0.5">{job.titre}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Remplissez le formulaire ci-dessous.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelBase}>Prénom <span className="text-red-500">*</span></label>
                <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Votre prénom" className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>Nom <span className="text-red-500">*</span></label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" className={inputBase} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelBase}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>Téléphone</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+216 XX XXX XXX" className={inputBase} />
              </div>
            </div>

            <div>
              <label className={labelBase}>Stage recherché</label>
              <input value={form.posteRecherche} onChange={(e) => setForm({ ...form, posteRecherche: e.target.value })} placeholder="Ex: Stage PFE, Stage d'été..." className={inputBase} />
            </div>

            <div>
              <label className={labelBase}>Lettre de motivation <span className="text-red-500">*</span></label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Présentez-vous, parlez de votre formation, vos motivations et pourquoi vous postulez à ce stage..."
                className="w-full px-5 py-4 rounded-3xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 outline-none transition-colors"
              />
            </div>

            <div>
              <label className={labelBase}>CV (PDF, max 5 Mo)</label>
              {cvFile ? (
                <div className="flex items-center justify-between p-4 rounded-2xl border border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-700">
                  <div className="flex items-center gap-3 text-sm font-semibold text-blue-600 dark:text-blue-300">
                    <Upload size={16} />
                    <span className="truncate max-w-[200px]">{cvFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setCvFile(null)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-700/50">
                  <Upload size={20} className="text-gray-400 dark:text-gray-500 mb-1" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour uploader votre CV</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold transition-colors shadow flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Envoi en cours...</>
              ) : (
                <><Send size={16} />Envoyer ma candidature</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}