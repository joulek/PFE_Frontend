"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import {
  getAllFiches,
  deleteFiche,
} from "../../services/evaluationCriteria.api";

export default function CriteresEvaluationListPage() {
  const router = useRouter();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal suppression
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadFiches() {
    setLoading(true);
    try {
      const res = await getAllFiches();
      setFiches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement fiches", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiches();
  }, []);

  function openDeleteModal(fiche) {
    setSelectedFiche(fiche);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    if (!selectedFiche) return;
    setDeleting(true);
    try {
      await deleteFiche(selectedFiche._id);
      setOpenDelete(false);
      setSelectedFiche(null);
      loadFiches();
    } catch (err) {
      console.error("Erreur suppression fiche", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4FAF2] px-10 py-8 dark:bg-[#0B1220]">
      {/* TITRE */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-[#0B1220] dark:text-white">
          Fiches d'évaluation
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Créez et gérez vos fiches d'évaluation des candidats.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* LISTE FICHES */}
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        ) : (
          fiches.map((fiche) => (
            <div
              key={fiche._id}
              className="rounded-2xl bg-white p-6 shadow-sm
                         dark:bg-[#0F1A2B] dark:border dark:border-white/10"
            >
              {/* 🆕 HEADER AVEC TITRE ET BADGE */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#0B1220] dark:text-white">
                    {fiche.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {fiche.description || "Aucune description"}
                  </p>
                </div>

                {/* 🆕 BADGE TYPE D'ENTRETIEN */}
                {fiche.interviewType && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full border border-[#7CC242]/50 bg-[#7CC242]/10 px-3 py-1 text-xs font-bold text-[#7CC242] dark:border-[#7CC242]/30 dark:bg-[#7CC242]/5 dark:text-[#7CC242]">
                      {fiche.interviewType}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/recruiter/criteres-evaluation/${fiche._id}`
                    )
                  }
                  className="flex items-center gap-2 rounded-full
                             bg-[#7CC242] px-5 py-2 text-sm font-semibold
                             text-white hover:opacity-90"
                >
                  <Pencil size={16} />
                  Modifier
                </button>

                <button
                  onClick={() => openDeleteModal(fiche)}
                  className="flex items-center gap-2 rounded-full
                             border border-red-400 px-5 py-2
                             text-sm font-semibold text-red-500
                             hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}

        {/* NOUVELLE FICHE */}
        <button
          onClick={() =>
            router.push("/recruiter/criteres-evaluation/create")
          }
          className="flex min-h-[180px] flex-col items-center justify-center
                     rounded-2xl border-2 border-dashed border-[#7CC242]
                     bg-[#F2FBEF] text-center transition
                     hover:bg-[#E9F7E3]
                     dark:bg-[#0F1A2B] dark:hover:bg-[#13213A]"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center
                          rounded-full bg-[#E2F4D9]
                          dark:bg-[#1E2F1E]">
            <Plus size={28} className="text-[#7CC242]" />
          </div>
          <p className="text-lg font-semibold text-[#0B1220] dark:text-white">
            Nouvelle fiche
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Créer une nouvelle fiche d'évaluation
          </p>
        </button>
      </div>

      {/* MODAL SUPPRESSION - EXACTEMENT COMME LA CAPTURE */}
      {openDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenDelete(false)}
          />

          {/* MODAL */}
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl
                       dark:bg-[#0F1A2B]"
          >
            {/* BOUTON FERMER */}
            <button
              onClick={() => setOpenDelete(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600
                         dark:text-white/40 dark:hover:text-white/60"
            >
              <X size={24} />
            </button>

            {/* TITRE */}
            <h3 className="text-2xl font-bold text-[#0B1220] dark:text-white">
              Supprimer la fiche
            </h3>

            {/* AVERTISSEMENT EN ROUGE */}
            <p className="mt-3 text-sm font-semibold text-red-500">
              Cette action est irréversible
            </p>

            {/* LIGNE DE SÉPARATION */}
            <div className="my-6 h-px bg-gray-200 dark:bg-white/10" />

            {/* CONTENU */}
            <div className="flex gap-4">
              {/* ICÔNE D'ALERTE */}
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full
                                bg-red-100 dark:bg-red-500/20">
                  <AlertCircle size={28} className="text-red-500" />
                </div>
              </div>

              {/* TEXTE */}
              <div className="flex-1">
                <p className="text-base text-[#0B1220] dark:text-white">
                  Êtes-vous sûr de vouloir supprimer cette fiche ?
                </p>
                <p className="mt-2 font-bold text-[#0B1220] dark:text-white">
                  {selectedFiche?.name}
                </p>
              </div>
            </div>

            {/* BOUTONS */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setOpenDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-gray-300 bg-white
                           px-6 py-3 text-sm font-semibold text-[#0B1220]
                           hover:bg-gray-50 disabled:opacity-60
                           dark:border-white/20 dark:bg-[#0F1A2B] dark:text-white
                           dark:hover:bg-white/5"
              >
                Annuler
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 px-6 py-3
                           text-sm font-semibold text-white
                           hover:bg-red-600 disabled:opacity-60
                           transition"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}