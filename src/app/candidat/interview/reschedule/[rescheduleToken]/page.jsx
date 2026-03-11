// app/candidat/reschedule-interview/[token]/page.jsx
import CandidatRescheduleRhTechInterview from "./CandidatRescheduleInterview";
export default async function Page({ params }) {
  const { token } = await params;
  return <CandidatRescheduleRhTechInterview token={token} />;
}
