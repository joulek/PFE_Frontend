"use client";

export default function DeleteJobModal({ open, onClose, onConfirm, job }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Supprimer l’offre
        </h2>

        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer l’offre :
          <br />
          <span className="font-semibold text-gray-800">
            {job?.titre}
          </span>
          ?
        </p>

        <div className="flex gap-4">
          {/* ✅ BOUTON CIBLABLE PAR CYPRESS */}
          <button
            data-cy="confirm-delete"
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600
                       text-white py-3 rounded-xl font-semibold"
          >
            Supprimer
          </button>

          <button
            onClick={onClose}
            className="flex-1 border py-3 rounded-xl"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
