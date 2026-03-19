// ✅ CHEMIN : app/candidat/interview/reschedule/[rescheduleToken]/page.jsx
import CandidatRescheduleInterview from "./CandidatRescheduleInterview";
import CandidatRescheduleRhTechInterview from "./CandidatRescheduleRhTechInterview";

async function getInterviewInfo(rescheduleToken) {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // ✅ On essaie d'abord la route Nord
    const resNord = await fetch(
      `${API_BASE}/api/interviewNord/reschedule-info/${rescheduleToken}`,
      { cache: "no-store" }
    );

    if (resNord.ok) {
      const data = await resNord.json();
      // ✅ Si trouvé côté Nord → c'est un entretien Nord
      if (data?.interview) return { isNord: true };
    }

    // ✅ Sinon on essaie la route RH classique
    const resRh = await fetch(
      `${API_BASE}/api/calendar/interview/reschedule-info/${rescheduleToken}`,
      { cache: "no-store" }
    );

    if (resRh.ok) {
      const data = await resRh.json();
      if (data?.interview) return { isNord: false };
    }

    return { isNord: false };
  } catch {
    return { isNord: false };
  }
}

export default async function Page({ params }) {
  const { rescheduleToken } = await params;

  const { isNord } = await getInterviewInfo(rescheduleToken);

  if (isNord) {
    return <CandidatRescheduleRhTechInterview token={rescheduleToken} />;
  }

  return <CandidatRescheduleInterview token={rescheduleToken} />;
}