"use client";
import { useEffect, useState } from "react";
import { getFiches, deleteFiche } from "../../services/fiche.api.js";
import { useRouter } from "next/navigation";

export default function FichesPage() {
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchFiches() {
    try {
      const res = await getFiches();
      setFiches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette fiche ?")) return;
    await deleteFiche(id);
    fetchFiches();
  }

  useEffect(() => {
    fetchFiches();
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fiches de renseignement</h1>

      {fiches.length === 0 && (
        <p className="text-gray-500">Aucune fiche trouvée.</p>
      )}

      <div className="space-y-4">
        {fiches.map((f) => (
          <div
            key={f._id}
            className="bg-white p-5 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{f.title}</h2>
              <p className="text-sm text-gray-500">
                {f.description || "Sans description"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/recruiter/fiche-renseignement/${f._id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Voir / Modifier
              </button>

              <button
                onClick={() => handleDelete(f._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
