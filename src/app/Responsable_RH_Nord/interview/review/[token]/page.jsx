// app/Responsable_RH_Nord/interview/review/[token]/page.jsx
import { Suspense } from "react";
import RhNordReviewReschedule from "./RhNordReviewReschedule";

export default async function Page({ params }) {
  const { token } = await params;
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#F0FAF0]">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <RhNordReviewReschedule token={token} />
    </Suspense>
  );
}