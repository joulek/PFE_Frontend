// ✅ CHEMIN : app/candidat/interview/reschedule/[rescheduleToken]/page.jsx
import CandidatRescheduleInterview from "./CandidatRescheduleInterview";
import CandidatRescheduleRhTechInterview from "./CandidatRescheduleRhTechInterview";

async function getInterviewType(rescheduleToken) {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(
      `${API_BASE}/api/interviews/reschedule-info/${rescheduleToken}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.interview?.type || null;
  } catch {
    return null;
  }
}

export default async function Page({ params }) {
  const { rescheduleToken } = await params;

  const interviewType = await getInterviewType(rescheduleToken);

  // ✅ Si type = "nord" ou "rh_nord" → composant RH Nord
  const isNord =
    interviewType === "rh_nord" ||
    interviewType === "nord" ||
    interviewType === "NORD" ||
    interviewType === "RH_NORD";

  if (isNord) {
    return <CandidatRescheduleRhTechInterview token={rescheduleToken} />;
  }

  // ✅ Par défaut → composant RH classique (rh, telephonique, rh_technique…)
  return <CandidatRescheduleInterview token={rescheduleToken} />;
}
