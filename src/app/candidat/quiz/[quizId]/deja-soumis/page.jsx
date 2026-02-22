"use client";

import { useRouter } from "next/navigation";

export default function DejaSoumisPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 transition-colors duration-300
      bg-[#EAF7EF] dark:bg-slate-950"
    >
      {/* CARD */}
      <div
        className="w-full max-w-xl text-center transition-colors duration-300
        bg-white dark:bg-slate-900
        rounded-3xl shadow-xl
        border border-[#D6EEDD] dark:border-slate-800
        p-8 sm:p-10"
      >
        {/* ICON */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center
            bg-[#6DB33F] dark:bg-[#63A93A]
            shadow-[0_0_0_8px_rgba(109,179,63,0.18)]"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>

        {/* BADGE */}
        <div className="inline-block mb-5">
          <span
            className="px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full
            bg-[#E6F5EA] text-[#2E6B3A]
            dark:bg-[#16341D] dark:text-[#9FE2AF]"
          >
            ACCÈS RESTREINT
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Quiz déjà soumis
        </h1>

        {/* TEXT */}
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
          Vous avez déjà complété et soumis ce quiz.
          <br />
          Une seconde participation n’est pas autorisée.
        </p>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-slate-200 dark:bg-slate-700" />

        {/* BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/jobs")}
            className="
              px-7 py-3.5 rounded-xl font-semibold text-base text-white
              bg-[#6DB33F] hover:bg-[#5EA735]
              dark:bg-[#63A93A] dark:hover:bg-[#6DB33F]
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            Retour aux offres
          </button>
        </div>

        {/* FOOTER */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-10">
          Si vous pensez qu’il s’agit d’une erreur, veuillez contacter le recruteur.
        </p>
      </div>
    </div>
  );
}