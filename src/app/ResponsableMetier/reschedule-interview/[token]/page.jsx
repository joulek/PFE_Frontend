"use client";

import { useParams, useRouter } from "next/navigation";
import ResponsableRescheduleCalendar from "../../../components/responsable/ResponsableRescheduleCalendar";
import { ArrowLeft } from "lucide-react";

export default function ResponsableReschedulePage() {
  const { token } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F6FFF7] dark:bg-gray-950 px-4 py-10 transition-colors">
      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-[32px] border border-emerald-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <div className="px-8 py-7 bg-gradient-to-r from-emerald-700 to-emerald-500 text-white">
            <div className="text-2xl font-extrabold leading-tight">Optylab</div>
            <div className="mt-1 text-white/85 text-sm">
              Proposer une autre date — Responsable Métier
            </div>
          </div>

          <div className="px-8 py-6">
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <ResponsableRescheduleCalendar token={token} />
          </div>

          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
            Optylab · Recrutement & RH
          </div>
        </div>
      </div>
    </div>
  );
}