"use client";

import { useEffect, useState } from "react";
import { getFiches, deleteFiche } from "../../services/fiche.api.js";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import DeleteFicheModal from "../../components/DeleteFicheModal";

export default function FichesPage() {
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState(null);

  const router = useRouter();

  async function fetchFiches() {
    try {
      const res = await getFiches();
      setFiches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!selectedFiche) return;
    await deleteFiche(selectedFiche._id);
    setOpenDelete(false);
    setSelectedFiche(null);
    fetchFiches();
  }

  useEffect(() => {
    fetchFiches();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-green-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900">
              Fiches de renseignement
            </h1>
            <p className="text-gray-600">
              Créez et gérez vos formulaires de recrutement.
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fiches.map((f) => (
              <div
                key={f._id}
                className="bg-white rounded-3xl p-6 border border-gray-100
                           hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {f.title}
                </h3>

                <p className="text-sm text-gray-600">
                  {f.description || "Aucune description"}
                </p>

                <div className="my-6 h-px bg-gray-100" />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/recruiter/fiche-renseignement/${f._id}`
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2
                               rounded-full bg-[#6CB33F] text-white
                               hover:bg-[#4E8F2F] transition text-sm font-medium"
                  >
                    <Pencil size={15} />
                    Modifier
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFiche(f);
                      setOpenDelete(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2
                               rounded-full border border-red-200 text-red-600
                               hover:bg-red-50 transition text-sm font-medium"
                  >
                    <Trash2 size={15} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}

            {/* NOUVELLE FICHE */}
            <div
              onClick={() =>
                router.push("/recruiter/fiche-renseignement/create")
              }
              className="rounded-3xl border-2 border-dashed border-green-400
                         flex flex-col items-center justify-center text-center
                         cursor-pointer hover:bg-green-50 transition
                         p-10 min-h-[220px]"
            >
              <div className="w-14 h-14 rounded-full bg-[#E9F5E3]
                              flex items-center justify-center mb-4">
                <Plus className="text-[#4E8F2F]" size={28} />
              </div>

              <h3 className="font-semibold text-gray-800 text-lg">
                Nouvelle fiche
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Créer un nouveau formulaire de renseignement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DELETE */}
      <DeleteFicheModal
        open={openDelete}
        ficheTitle={selectedFiche?.title}
        onClose={() => {
          setOpenDelete(false);
          setSelectedFiche(null);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
