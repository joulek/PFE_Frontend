// app/recruiter/calendar/page.jsx
// Server Component — PAS de "use client" ici !
// Passe les searchParams directement au CalendarRouter client

import { Suspense } from "react";
import CalendarRouter from "../../components/CalendarRouter";

export default async function CalendarPage({ searchParams }) {
  // In Next.js 15, searchParams is a Promise — must be awaited
  const { type = null } = await searchParams;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-[#6CB33F] border-t-transparent rounded-full"/>
      </div>
    }>
      <CalendarRouter initialType={type} />
    </Suspense>
  );
}