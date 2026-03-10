"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ResponsableConfirmInterviewPage() {
  const { token } = useParams();
  const router = useRouter();
  const [state, setState] = useState({
    loading: true,
    ok: false,
    message: "",
    error: "",
  });

  useEffect(() => {
    if (!token) return;

    (async () => {
      setState({ loading: true, ok: false, message: "", error: "" });
      try {
        const res = await fetch(`${API_URL}/api/calendar/rh-tech/manager/confirm/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Erreur confirmation");
        }

        setState({
          loading: false,
          ok: true,
          message: data?.message || "Entretien confirmé ✅",
          error: "",
        });
      } catch (e) {
        setState({
          loading: false,
          ok: false,
          message: "",
          error: e?.message || "Erreur",
        });
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6FFF7] via-white to-[#F0FDF4] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-10 transition-colors">
      <div className="mx-auto w-full max-w-2xl">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-[#6CB33F]/20 dark:border-[#6CB33F]/10 bg-white dark:bg-gray-900/80 shadow-2xl backdrop-blur-sm dark:backdrop-blur-md">
          {/* Header */}
          <div className="px-8 py-10 bg-gradient-to-r from-[#6CB33F] to-[#5a9b33] text-white text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
              <div className="absolute -bottom-8 left-20 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <div className="text-4xl font-extrabold tracking-tight">
                Optylab
              </div>
              <div className="mt-2 text-sm font-medium text-white/95">
                Confirmation entretien RH + Technique
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-10">
            <button
              onClick={() => router.back()}
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#6CB33F] hover:text-[#5a9b33] dark:hover:text-[#8dd366] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            {state.loading ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-[#6CB33F]/10 rounded-full animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-[#6CB33F] animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Confirmation en cours…
                </p>
              </div>
            ) : state.ok ? (
              <div className="text-center py-8">
                {/* Success Icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#6CB33F]/20 to-[#6CB33F]/5 dark:from-[#6CB33F]/30 dark:to-[#6CB33F]/5 flex items-center justify-center border-2 border-[#6CB33F]/30">
                  <CheckCircle2 className="w-10 h-10 text-[#6CB33F]" />
                </div>

                {/* Success Title */}
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                  Confirmé ✅
                </h2>

                {/* Message */}
                <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {state.message}
                </p>

                {/* Info text */}
                <div className="mt-5 p-4 rounded-2xl bg-[#6CB33F]/5 dark:bg-[#6CB33F]/10 border border-[#6CB33F]/20 dark:border-[#6CB33F]/30">
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    Le candidat va recevoir un email pour confirmer ou proposer une autre date.
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => router.push("/")}
                  className="mt-8 px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-[#6CB33F] to-[#5a9b33] hover:from-[#5a9b33] hover:to-[#4a8a2a] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Retour à l'accueil
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                {/* Error Icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border-2 border-red-200 dark:border-red-500/30">
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-500" />
                </div>

                {/* Error Title */}
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                  Erreur
                </h2>

                {/* Error Message */}
                <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">
                  {state.error}
                </p>

                {/* Info text */}
                <div className="mt-5 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                    Le lien de confirmation a expiré ou est invalide. Veuillez demander un nouveau lien au recruteur.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-[#6CB33F] to-[#5a9b33] hover:from-[#5a9b33] hover:to-[#4a8a2a] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3 rounded-2xl font-bold text-[#6CB33F] bg-[#6CB33F]/10 dark:bg-[#6CB33F]/20 border border-[#6CB33F]/30 hover:bg-[#6CB33F]/20 dark:hover:bg-[#6CB33F]/30 transition-all duration-300"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}