"use client";
import { useRouter } from "next/navigation";



export default function MerciPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3FBF6] p-6">

      {/* CARD */}
      <div className="w-full max-w-xl bg-white rounded-[28px] shadow-sm border border-gray-100 p-10 text-center">

        {/* SUCCESS ICON */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center
                          shadow-[0_0_0_8px_rgba(34,197,94,0.12)]">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* BADGE */}
        <div className="inline-block mb-4">
          <span className="px-3 py-1 text-xs font-semibold tracking-wide
                           bg-green-100 text-green-700 rounded-full">
            SOUMISSION ENREGISTRÉE
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Merci pour votre réponse
        </h1>

        {/* TEXT */}
        <p className="text-gray-600 leading-relaxed">
          Votre formulaire de renseignement a été soumis
          <br />
          avec succès.
        </p>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-gray-100" />

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* PRIMARY */}
          <button
            onClick={() => router.push("/jobs")}
            className="px-6 py-3 rounded-full bg-[#6CB33F] text-white
             font-medium hover:bg-[#4E8F2F] transition"
          >
            Retour à l'accueil
          </button>

        </div>

        {/* FOOTER NOTE */}
        <p className="text-xs text-gray-400 mt-8">
          Notre équipe examinera votre candidature dans les plus brefs délais.
        </p>

      </div>
    </div>
  );
}
