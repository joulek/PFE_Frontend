// app/candidat/interview/reschedule/[rescheduleToken]/page.jsx
// ✅ Le dossier s'appelle [rescheduleToken] → params.rescheduleToken
import CandidatRescheduleInterview from "./CandidatRescheduleInterview";

export default async function Page({ params }) {
  const { rescheduleToken } = await params;
  return <CandidatRescheduleInterview token={rescheduleToken} />;
}