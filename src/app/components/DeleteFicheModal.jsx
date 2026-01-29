"use client";

import { X, AlertTriangle } from "lucide-react";

export default function DeleteFicheModal({
  open,
  onClose,
  onConfirm,
  ficheTitle,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-xl p-8">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <h2 className="text-2xl font-extrabold text-gray-900">
          Supprimer la fiche
        </h2>
        <p className="text-sm text-red-600 mt-1">
          Cette action est irréversible
        </p>

        <div className="my-6 h-px bg-gray-200" />

        {/* CONTENT */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="text-red-500" />
          </div>

          <div>
            <p className="text-gray-700 mb-1">
              Êtes-vous sûr de vouloir supprimer cette fiche ?
            </p>
            <p className="font-semibold text-gray-900">
              {ficheTitle}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-gray-300
                       text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-full bg-red-500
                       text-white hover:bg-red-600 transition font-medium"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
