// app/candidat/reschedule-interview/[token]/page.jsx
import CandidatRescheduleRhTechInterview from "./CandidatRescheduleRhTechInterview";

export default async function Page({ params }) {
  const { token } = await params;
  return <CandidatRescheduleRhTechInterview token={token} />;
}
