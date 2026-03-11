"use client";
// app/Responsable_RH_Nord/calendar/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Page calendrier dédiée au RESPONSABLE_RH_NORD — séparée du recruteur
//
// Quand on arrive depuis "Entretien" dans PreInterviewNordList :
//   URL : ?newEvent=1&type=entretien_nord
//         &candidateName=Prénom Nom
//         &candidateEmail=email@example.com
//         &jobTitle=Titre du poste
//         &candidatureId=<_id MongoDB>
//
// → GoogleCalendarWithInterviewNord lit ces params et affiche
//   la bannière verte + active le sélecteur de date
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense } from "react";
import GoogleCalendarWithInterviewNord from "../../components/GoogleCalendarWithInterviewNord";

export default function CalendarNordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[#F0FAF0] dark:bg-gray-950">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Chargement du calendrier…
            </p>
          </div>
        </div>
      }
    >
      <GoogleCalendarWithInterviewNord />
    </Suspense>
  );
}