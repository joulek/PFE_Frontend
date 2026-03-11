// ✅ CHEMIN CORRECT : app/candidat/interview/reschedule/[rescheduleToken]/page.jsx
import CandidatRescheduleRhTechInterview from "./Candidatreschedulerhtechinterview";

export default async function Page({ params }) {
  const { rescheduleToken } = await params;
  return <CandidatRescheduleRhTechInterview token={rescheduleToken} />;
}
